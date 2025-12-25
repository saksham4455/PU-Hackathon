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
    if (user && profile?.role === 'admin') {
      loadIssue();
    }
  }, [user, profile, issueId]);

  const loadIssue = async () => {
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
    if (!issue || newStatus === issue.status) return;

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
    if (!standaloneComment.trim()) return;

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

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Access Denied: Admin Only</p>
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
    <div className="min-h-screen bg-gray-50 flex-grow">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 capitalize mb-2">
                {issue.issue_type}
              </h1>
              <p className="text-sm text-gray-500">Issue ID: {issue.id}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${getPriorityColor(
                  issue.priority || 'medium'
                )}`}
              >
                {getPriorityLabel(issue.priority || 'medium')} Priority
              </span>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                  issue.status
                )}`}
              >
                {getStatusLabel(issue.status)}
              </span>
            </div>
          </div>

          {/* Citizen Report Details Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Citizen Report Details</h2>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Date Reported</p>
                    <p className="font-medium text-gray-900">
                      {new Date(issue.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Reported By</p>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">
                        {issue.is_anonymous ? 'Anonymous User' : `User ID: ${issue.user_id.slice(0, 8)}`}
                      </p>
                      {issue.is_anonymous && <Shield className="w-4 h-4 text-gray-400" />}
                    </div>
                    {issue.is_anonymous && issue.anonymous_email && (
                      <p className="text-xs text-gray-500 mt-1">Email: {issue.anonymous_email}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium text-gray-900">
                      {issue.location_address || `${Number(issue.latitude).toFixed(6)}, ${Number(issue.longitude).toFixed(6)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-medium text-gray-900">
                      {new Date(issue.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 bg-white p-4 rounded-lg border">{issue.description}</p>
              </div>

              {issue.photo_url && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <Camera className="w-5 h-5 mr-2" />
                    Submitted Photo(s)
                  </h3>
                  <div className="bg-white p-4 rounded-lg border">
                    {issue.photos && issue.photos.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {issue.photos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img
                              src={photo}
                              alt={`Issue Photo ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                              onClick={() => window.open(photo, '_blank')}
                            />
                            <p className="text-xs text-gray-500 mt-1">Photo {index + 1}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <img
                        src={issue.photo_url}
                        alt="Issue"
                        className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition"
                        onClick={() => window.open(issue.photo_url, '_blank')}
                      />
                    )}
                    <p className="text-sm text-gray-500 mt-2">Click image to view larger</p>
                  </div>
                </div>
              )}

              {issue.video_url && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <Video className="w-5 h-5 mr-2" />
                    Submitted Video
                  </h3>
                  <div className="bg-white p-4 rounded-lg border">
                    <video
                      src={issue.video_url}
                      controls
                      className="max-w-full h-auto rounded-lg"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}

              {issue.voice_note_url && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <Volume2 className="w-5 h-5 mr-2" />
                    Voice Note
                  </h3>
                  <div className="bg-white p-4 rounded-lg border">
                    <audio
                      src={issue.voice_note_url}
                      controls
                      className="w-full"
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Location</h3>
                <div className="bg-white p-4 rounded-lg border">
                  <IssueMap
                    issues={[issue]}
                    center={{ lat: Number(issue.latitude), lng: Number(issue.longitude) }}
                    zoom={15}
                    height="400px"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Admin Notes Section */}
          {issue.admin_notes && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Notes</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700">{issue.admin_notes}</p>
              </div>
            </div>
          )}

          {/* Public Comments Section */}
          {issue.public_comments && issue.public_comments.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Public Comments</h2>
              <div className="space-y-4">
                {issue.public_comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{comment.author_name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          comment.author_type === 'admin' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {comment.author_type === 'admin' ? 'Admin' : 'Citizen'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status History Section */}
          {issue.status_history && issue.status_history.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Status History</h2>
              <div className="space-y-4">
                {issue.status_history
                  .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
                  .map((historyItem) => (
                    <div key={historyItem.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              historyItem.old_status === 'resolved' 
                                ? 'bg-green-100 text-green-700'
                                : historyItem.old_status === 'in_progress'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {historyItem.old_status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              historyItem.new_status === 'resolved' 
                                ? 'bg-green-100 text-green-700'
                                : historyItem.new_status === 'in_progress'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {historyItem.new_status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(historyItem.changed_at).toLocaleDateString()} at {new Date(historyItem.changed_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Changed by: <span className="font-medium">{historyItem.changed_by_name}</span>
                        </span>
                        {historyItem.comment && (
                          <span className="text-sm text-gray-600 italic">"{historyItem.comment}"</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Update Issue Status</h2>

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3 text-green-700">
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
              <span>Status updated successfully!</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-red-700">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Status
              </label>
              <div
                className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                  issue.status
                )}`}
              >
                {getStatusLabel(issue.status)}
              </div>
            </div>

            <div>
              <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                id="newStatus"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label htmlFor="publicComment" className="block text-sm font-medium text-gray-700 mb-2">
                Public Comment (Optional)
                <span className="text-sm text-gray-500 ml-1">- Visible to citizens</span>
              </label>
              <textarea
                id="publicComment"
                value={publicComment}
                onChange={(e) => setPublicComment(e.target.value)}
                placeholder="Add a public comment explaining the status update..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                maxLength={500}
              />
              <div className="text-sm text-gray-500 mt-1">
                {publicComment.length}/500 characters
              </div>
            </div>

            <button
              onClick={handleUpdateStatus}
              disabled={updating || newStatus === issue.status}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Public Comment</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="standaloneComment" className="block text-sm font-medium text-gray-700 mb-2">
                Public Comment
                <span className="text-sm text-gray-500 ml-1">- Visible to citizens</span>
              </label>
              <textarea
                id="standaloneComment"
                value={standaloneComment}
                onChange={(e) => setStandaloneComment(e.target.value)}
                placeholder="Add a public comment for citizens..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                maxLength={500}
              />
              <div className="text-sm text-gray-500 mt-1">
                {standaloneComment.length}/500 characters
              </div>
            </div>

            <button
              onClick={handleAddStandaloneComment}
              disabled={updating || !standaloneComment.trim()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Adding...' : 'Add Comment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
