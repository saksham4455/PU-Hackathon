import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Camera, Video, Volume2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { localStorageService, Issue } from '../lib/localStorage';
import UserStatsWidget from '../components/UserStatsWidget';
import { calculateUserStats } from '../lib/gamification';

export function MyComplaintsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMyIssues();
    }
  }, [user]);

  const loadMyIssues = async () => {
    try {
      if (!user?.id) return;

      // Load user's issues
      const { issues, error } = await localStorageService.getUserIssues(user.id);
      if (error) throw error;
      setIssues(issues);

      // Load all issues for stats calculation
      const allIssuesResult = await localStorageService.getIssues();
      if (allIssuesResult.error) throw allIssuesResult.error;
      setAllIssues(allIssuesResult.issues);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Please log in to view your complaints</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Login
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex-grow py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-bl from-purple-600/10 to-blue-600/10 -skew-y-6 transform origin-top-right z-0 pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="mb-10 animate-fade-in text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4 inline-flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-2xl shadow-sm">
              <ClipboardList className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
            </div>
            My <span className="text-gradient">Complaints</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Track the status of your reported issues and view the impact you've made in your community.
          </p>
        </div>

        {/* User Stats Widget */}
        {user && allIssues.length > 0 && (
          <div className="mb-12 animate-slide-up relative">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl rounded-3xl -z-10 shadow-xl border border-white/20"></div>
            <UserStatsWidget {...calculateUserStats(user.id, allIssues)} />
          </div>
        )}

        {issues.length === 0 ? (
          <div className="glass-panel rounded-3xl p-16 text-center animate-fade-in flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <ClipboardList className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-gray-800 mb-3">No complaints yet</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">
              You haven't reported any issues yet. Be the first to improve your neighborhood!
            </p>
            <button
              onClick={() => navigate('/report')}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl font-bold text-lg flex items-center gap-2 transform hover:-translate-y-1"
            >
              Start Reporting
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {issues.map((issue, index) => (
              <div
                key={issue.id}
                className="glass-panel rounded-2xl p-6 md:p-8 hover:shadow-xl transition-all duration-300 animate-slide-up group border border-white/60"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-gray-900 capitalize font-heading">
                        {issue.issue_type.replace('_', ' ')}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${getPriorityColor(
                            issue.priority || 'medium'
                          ).replace('bg-', 'bg-opacity-20 bg-').replace('text-', 'text-opacity-80 border border-opacity-20 border-')}`}
                        >
                          {getPriorityLabel(issue.priority || 'medium')}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${getStatusColor(
                            issue.status
                          ).replace('bg-', 'bg-opacity-20 bg-').replace('text-', 'text-opacity-80 border border-opacity-20 border-')}`}
                        >
                          {getStatusLabel(issue.status)}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700 text-lg leading-relaxed mb-4 pl-4 border-l-4 border-blue-100 italic bg-gray-50/50 p-3 rounded-r-lg">
                      "{issue.description}"
                    </p>

                    {issue.location_address && (
                      <div className="flex items-center text-gray-500 mb-2 font-medium">
                        <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        {issue.location_address}
                      </div>
                    )}

                    {/* Media Gallery Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                      {/* Multiple Photos */}
                      {issue.photos && issue.photos.map((photo, i) => (
                        <div key={i} className="relative group/image overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer bg-gray-100 aspect-square">
                          <img
                            src={photo}
                            alt={`Evidence ${i + 1}`}
                            className="w-full h-full object-cover transform group-hover/image:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="w-6 h-6 text-white drop-shadow-lg" />
                          </div>
                        </div>
                      ))}

                      {/* Single Photo legacy fallback */}
                      {issue.photo_url && (!issue.photos || issue.photos.length === 0) && (
                        <div className="relative group/image overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer bg-gray-100 aspect-square">
                          <img
                            src={issue.photo_url}
                            alt="Evidence"
                            className="w-full h-full object-cover transform group-hover/image:scale-110 transition-transform duration-500"
                          />
                        </div>
                      )}

                      {/* Video Thumbnail */}
                      {issue.video_url && (
                        <div className="relative group/video overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer bg-gray-900 aspect-square flex items-center justify-center">
                          <video src={issue.video_url} className="absolute inset-0 w-full h-full object-cover opacity-60"></video>
                          <div className="z-10 bg-white/20 backdrop-blur-sm p-3 rounded-full border border-white/40 group-hover/video:scale-110 transition-transform">
                            <Video className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Voice Note */}
                      {issue.voice_note_url && (
                        <div className="relative overflow-hidden rounded-xl shadow-sm bg-gradient-to-br from-green-50 to-emerald-100 aspect-square flex flex-col items-center justify-center p-4 border border-green-200">
                          <Volume2 className="w-8 h-8 text-green-600 mb-2" />
                          <span className="text-xs font-bold text-green-700 uppercase">Voice Note</span>
                          <audio src={issue.voice_note_url} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" controls />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Interaction & History Section */}
                <div className="border-t border-gray-100 pt-6 mt-6 grid md:grid-cols-2 gap-8">
                  {/* Comments Feed */}
                  {issue.public_comments && issue.public_comments.length > 0 && (
                    <div>
                      <h4 className="flex items-center text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
                        Comments & Updates
                      </h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {issue.public_comments.map((comment) => (
                          <div key={comment.id} className="bg-white/80 rounded-xl p-3 shadow-sm border border-gray-100 text-sm">
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900">{comment.author_name}</span>
                                {comment.author_type === 'admin' && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase">Admin</span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700 leading-relaxed">{comment.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status Timeline */}
                  {issue.status_history && issue.status_history.length > 0 && (
                    <div>
                      <h4 className="flex items-center text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                        <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Timeline
                      </h4>
                      <div className="space-y-0 relative pl-2">
                        <div className="absolute top-0 bottom-0 left-[11px] w-0.5 bg-gray-200"></div>
                        {issue.status_history
                          .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
                          .map((historyItem) => (
                            <div key={historyItem.id} className="relative pl-8 pb-6 last:pb-0">
                              <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10 ${historyItem.new_status === 'resolved' ? 'bg-green-500' :
                                historyItem.new_status === 'in_progress' ? 'bg-yellow-500' : 'bg-blue-500'
                                }`}>
                              </div>
                              <div className="bg-white/60 rounded-lg p-3 border border-gray-100 shadow-sm text-sm">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-semibold text-gray-800 capitalize">{historyItem.new_status.replace('_', ' ')}</span>
                                  <span className="text-[10px] text-gray-500">{new Date(historyItem.changed_at).toLocaleDateString()}</span>
                                </div>
                                <div className="text-gray-600 text-xs">
                                  Updated by <span className="font-medium">{historyItem.changed_by_name}</span>
                                </div>
                                {historyItem.comment && (
                                  <div className="mt-2 text-xs italic text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
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

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-mono text-gray-400">
                  <span>Created: {new Date(issue.created_at).toLocaleDateString()}</span>
                  <span>ID: #{issue.id.slice(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
