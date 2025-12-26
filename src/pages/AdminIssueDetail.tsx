import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, User, CheckCircle, AlertCircle, Camera, Video, Volume2, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { localStorageService, Issue } from '../lib/localStorage';
import { IssueMap } from '../components/IssueMap';

export function AdminIssueDetail() {
  const navigate = useNavigate();
  const { issueId } = useParams<{ issueId: string }>();
  const { user, profile } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [publicComment, setPublicComment] = useState<string>('');
  const [standaloneComment, setStandaloneComment] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && profile?.role === 'super_admin') {
      loadIssue();
    }
  }, [user, profile, issueId]);

  const loadIssue = async () => {
    if (!issueId) return;
    try {
      const { issue: issueData, error } = await localStorageService.getIssueById(issueId);

      if (error) throw error;
      if (issueData) {
        setIssue(issueData);
        setNewStatus(issueData.status);
      }
    } catch (error) {
      console.error('Error loading issue:', error);
      setError('Failed to load issue details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!issue || newStatus === issue.status || !issueId) return;

    setUpdating(true);
    setError('');
    setSuccess(false);

    try {
      // First update the status
      const { issue: updatedIssue, error } = await localStorageService.updateIssueStatus(
        issueId,
        newStatus as Issue['status'],
        user!.id,
        profile!.full_name,
        publicComment.trim() || undefined
      );

      if (error) throw error;

      if (updatedIssue) {
        setIssue(updatedIssue);

        // Add public comment if provided
        if (publicComment.trim()) {
          const { comment, error: commentError } = await localStorageService.addPublicComment(
            issueId,
            publicComment.trim(),
            'admin',
            user!.id,
            profile!.full_name
          );

          if (commentError) {
            console.error('Failed to add public comment:', commentError);
            setError('Status updated but failed to add comment');
          } else if (comment) {
            // Update the issue with the new comment
            setIssue(prevIssue => {
              if (!prevIssue) return prevIssue;
              return {
                ...prevIssue,
                public_comments: [...(prevIssue.public_comments || []), comment]
              };
            });
          }

          setPublicComment(''); // Clear the comment field
        }

        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddStandaloneComment = async () => {
    if (!standaloneComment.trim() || !issueId) return;

    setUpdating(true);
    setError('');
    setSuccess(false);

    try {
      const { comment, error: commentError } = await localStorageService.addPublicComment(
        issueId,
        standaloneComment.trim(),
        'admin',
        user!.id,
        profile!.full_name
      );

      if (commentError) {
        throw commentError;
      } else if (comment) {
        // Update the issue with the new comment
        setIssue(prevIssue => {
          if (!prevIssue) return prevIssue;
          return {
            ...prevIssue,
            public_comments: [...(prevIssue.public_comments || []), comment]
          };
        });

        setStandaloneComment(''); // Clear the comment field
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-red-100 text-red-700';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityLabel = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  if (!user || profile?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Access Denied: Super Admin Only</p>
          <button
            onClick={() => navigate('/home')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Issue not found</p>
          <button
            onClick={() => navigate('/admin')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex-grow py-8 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-200/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-200/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <button
          onClick={() => navigate('/admin')}
          className="group flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors duration-200"
        >
          <div className="p-2 bg-white/50 rounded-full group-hover:bg-blue-50 transition-colors shadow-sm cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-medium">Back to Dashboard</span>
        </button>

        <div className="glass-panel p-8 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 capitalize bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                  {issue.issue_type.replace('_', ' ')}
                </h1>
                <span className="px-3 py-1 bg-gray-100/80 text-gray-500 rounded-full text-xs font-mono border border-gray-200">
                  #{issue.id.slice(0, 8)}
                </span>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Reported on {new Date(issue.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border flex items-center gap-2 ${getPriorityColor(
                  issue.priority || 'medium'
                )}`}
              >
                <div className={`w-2 h-2 rounded-full ${issue.priority === 'critical' || issue.priority === 'high' ? 'animate-pulse' : ''} bg-current`}></div>
                {getPriorityLabel(issue.priority || 'medium')} Priority
              </span>
              <span
                className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border flex items-center gap-2 ${getStatusColor(
                  issue.status
                )}`}
              >
                {getStatusLabel(issue.status)}
              </span>
            </div>
          </div>

          {/* Citizen Report Details Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-900">Report Details</h2>
            </div>

            <div className="bg-white/40 backdrop-blur-sm rounded-xl border border-white/40 p-6 shadow-inner">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Reported By</p>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-gray-900">
                        {issue.is_anonymous ? 'Anonymous User' : `User ID: ${issue.user_id.slice(0, 8)}`}
                      </p>
                      {issue.is_anonymous && <Shield className="w-4 h-4 text-gray-400" />}
                    </div>
                    {issue.is_anonymous && issue.anonymous_email && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                        {issue.anonymous_email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Location</p>
                    <p className="font-semibold text-gray-900 break-all">
                      {issue.location_address || `${Number(issue.latitude).toFixed(6)}, ${Number(issue.longitude).toFixed(6)}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Description</h3>
                <div className="bg-white/60 p-5 rounded-xl border border-white/50 text-gray-800 leading-relaxed shadow-sm">
                  {issue.description}
                </div>
              </div>

              {/* Media Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {issue.photo_url && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4" /> Photos
                    </h3>
                    <div className="bg-white/60 p-4 rounded-xl border border-white/50 shadow-sm">
                      {issue.photos && issue.photos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {issue.photos.map((photo, index) => (
                            <div key={index} className="relative group overflow-hidden rounded-lg cursor-pointer">
                              <img
                                src={photo}
                                alt={`Issue Photo ${index + 1}`}
                                className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"
                                onClick={() => window.open(photo, '_blank')}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="relative group overflow-hidden rounded-lg cursor-pointer">
                          <img
                            src={issue.photo_url}
                            alt="Issue"
                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                            onClick={() => window.open(issue.photo_url, '_blank')}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {issue.video_url && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Video className="w-4 h-4" /> Video
                      </h3>
                      <div className="bg-white/60 p-2 rounded-xl border border-white/50 shadow-sm">
                        <video src={issue.video_url} controls className="w-full rounded-lg max-h-48 bg-black" />
                      </div>
                    </div>
                  )}

                  {issue.voice_note_url && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Volume2 className="w-4 h-4" /> Voice Note
                      </h3>
                      <div className="bg-white/60 p-3 rounded-xl border border-white/50 shadow-sm flex items-center justify-center">
                        <audio src={issue.voice_note_url} controls className="w-full h-10" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Map Location</h3>
                <div className="rounded-xl overflow-hidden shadow-sm border border-white/50">
                  <IssueMap
                    issues={[issue]}
                    center={{ lat: Number(issue.latitude), lng: Number(issue.longitude) }}
                    zoom={15}
                    height="300px"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Admin Notes Section */}
          {issue.admin_notes && (
            <div className="mb-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900">Admin Internal Notes</h2>
              </div>
              <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-100 rounded-xl p-5 shadow-sm text-gray-700">
                {issue.admin_notes}
              </div>
            </div>
          )}

          {/* Public Comments Section */}
          {issue.public_comments && issue.public_comments.length > 0 && (
            <div className="mb-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900">Conversation</h2>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar p-1">
                {issue.public_comments.map((comment) => (
                  <div key={comment.id} className={`p-4 rounded-xl border shadow-sm transition-all hover:shadow-md ${comment.author_type === 'admin'
                    ? 'bg-blue-50/60 border-blue-100 ml-8'
                    : 'bg-white/60 border-gray-100 mr-8'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900">{comment.author_name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${comment.author_type === 'admin'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                          }`}>
                          {comment.author_type === 'admin' ? 'Admin' : 'Citizen'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{comment.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status History Section */}
          {issue.status_history && issue.status_history.length > 0 && (
            <div className="mb-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-gray-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900">History</h2>
              </div>
              <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pl-6 py-2">
                {issue.status_history
                  .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
                  .map((historyItem, index) => (
                    <div key={historyItem.id} className="relative animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white bg-blue-500 shadow-sm"></div>
                      <div className="bg-white/60 border border-white/60 rounded-lg p-3 shadow-sm hover:shadow-md transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${historyItem.old_status === 'resolved' ? 'bg-green-100 text-green-800' :
                              historyItem.old_status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>{historyItem.old_status.replace('_', ' ')}</span>
                            <span className="text-gray-400">→</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${historyItem.new_status === 'resolved' ? 'bg-green-100 text-green-800' :
                              historyItem.new_status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>{historyItem.new_status.replace('_', ' ')}</span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(historyItem.changed_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Updated by <span className="font-semibold text-gray-900">{historyItem.changed_by_name}</span>
                        </p>
                        {historyItem.comment && (
                          <div className="mt-2 text-sm text-gray-500 bg-gray-50/50 p-2 rounded italic border border-gray-100">
                            "{historyItem.comment}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Panel Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>

          {/* Update Status Panel */}
          <div className="glass-panel p-8 transform transition-all hover:scale-[1.01] hover:shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-10 -mt-10 transition-all group-hover:bg-blue-500/10"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="p-2 bg-blue-100 text-blue-600 rounded-lg shadow-sm">
                <CheckCircle className="w-5 h-5" />
              </span>
              Update Status
            </h2>

            {success && (
              <div className="mb-6 p-4 bg-green-50/80 backdrop-blur-sm border border-green-200 rounded-xl flex items-start space-x-3 text-green-700 shadow-sm animate-fade-in">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <span className="font-medium">Action completed successfully!</span>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl flex items-start space-x-3 text-red-700 shadow-sm animate-fade-in">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                <div className={`inline-flex px-4 py-2 rounded-lg text-sm font-bold border shadow-sm ${getStatusColor(issue.status)}`}>
                  {getStatusLabel(issue.status)}
                </div>
              </div>

              <div>
                <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                <div className="relative">
                  <select
                    id="newStatus"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:bg-white/80"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="publicComment" className="block text-sm font-medium text-gray-700 mb-2">
                  Status Note (Public)
                  <span className="text-xs text-gray-400 font-normal ml-2">Optional - Visible to all</span>
                </label>
                <textarea
                  id="publicComment"
                  value={publicComment}
                  onChange={(e) => setPublicComment(e.target.value)}
                  placeholder="Explain why the status is changing..."
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:bg-white/80 min-h-[100px]"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {publicComment.length}/500
                </div>
              </div>

              <button
                onClick={handleUpdateStatus}
                disabled={updating || newStatus === issue.status}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-bold"
              >
                {updating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating Status...
                  </span>
                ) : 'Update Status'}
              </button>
            </div>
          </div>

          {/* Add Comment Panel */}
          <div className="glass-panel p-8 transform transition-all hover:scale-[1.01] hover:shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-bl-full -mr-10 -mt-10 transition-all group-hover:bg-green-500/10"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="p-2 bg-green-100 text-green-600 rounded-lg shadow-sm">
                <Volume2 className="w-5 h-5" />
              </span>
              Public Communication
            </h2>

            <div className="space-y-6">
              <div>
                <label htmlFor="standaloneComment" className="block text-sm font-medium text-gray-700 mb-2">
                  Add New Comment
                  <span className="text-xs text-gray-400 font-normal ml-2">Visible to citizens</span>
                </label>
                <textarea
                  id="standaloneComment"
                  value={standaloneComment}
                  onChange={(e) => setStandaloneComment(e.target.value)}
                  placeholder="Ask for more info or provide an update without changing status..."
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all hover:bg-white/80 min-h-[120px]"
                  rows={4}
                  maxLength={500}
                />
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {standaloneComment.length}/500
                </div>
              </div>

              <button
                onClick={handleAddStandaloneComment}
                disabled={updating || !standaloneComment.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-700 hover:to-green-600 shadow-lg shadow-green-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-bold"
              >
                {updating ? 'Posting...' : 'Post Public Comment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
