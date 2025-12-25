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
    <div className="min-h-screen bg-gray-50 flex-grow">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
            <ClipboardList className="w-10 h-10 mr-3" />
            My Complaints
          </h1>
          <p className="text-gray-600">Track the status of all your reported issues</p>
        </div>

        {/* User Stats Widget */}
        {user && allIssues.length > 0 && (
          <div className="mb-8">
            <UserStatsWidget {...calculateUserStats(user.id, allIssues)} />
          </div>
        )}

        {issues.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No complaints yet</h2>
            <p className="text-gray-500 mb-6">Start by reporting an issue in your city</p>
            <button
              onClick={() => navigate('/report')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Report an Issue
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 capitalize">
                        {issue.issue_type}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                          issue.priority || 'medium'
                        )}`}
                      >
                        {getPriorityLabel(issue.priority || 'medium')}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          issue.status
                        )}`}
                      >
                        {getStatusLabel(issue.status)}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{issue.description}</p>
                    {issue.location_address && (
                      <p className="text-sm text-gray-500 mb-2">{issue.location_address}</p>
                    )}

                    {/* Multiple Photos */}
                    {issue.photos && issue.photos.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Camera className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Photos ({issue.photos.length})</span>
                        </div>
                        <div className="flex space-x-2 overflow-x-auto">
                          {issue.photos.map((photo, index) => (
                            <img
                              key={index}
                              src={photo}
                              alt={`Issue Photo ${index + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 flex-shrink-0"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Single Photo (backward compatibility) */}
                    {issue.photo_url && (!issue.photos || issue.photos.length === 0) && (
                      <img
                        src={issue.photo_url}
                        alt="Issue"
                        className="mt-3 max-w-sm rounded-lg border-2 border-gray-200"
                      />
                    )}

                    {/* Video */}
                    {issue.video_url && (
                      <div className="mt-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Video className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Video</span>
                        </div>
                        <video
                          src={issue.video_url}
                          controls
                          className="max-w-sm rounded-lg border-2 border-gray-200"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}

                    {/* Voice Note */}
                    {issue.voice_note_url && (
                      <div className="mt-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Volume2 className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Voice Note</span>
                        </div>
                        <audio
                          src={issue.voice_note_url}
                          controls
                          className="w-full max-w-sm"
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                </div>

                {/* Public Comments Section */}
                {issue.public_comments && issue.public_comments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Updates & Comments</h4>
                    <div className="space-y-3">
                      {issue.public_comments.map((comment) => (
                        <div key={comment.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 text-sm">{comment.author_name}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${comment.author_type === 'admin'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                                }`}>
                                {comment.author_type === 'admin' ? 'Admin' : 'Citizen'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status History Section */}
                {issue.status_history && issue.status_history.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Status History</h4>
                    <div className="space-y-2">
                      {issue.status_history
                        .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
                        .map((historyItem) => (
                          <div key={historyItem.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${historyItem.old_status === 'resolved'
                                  ? 'bg-green-100 text-green-700'
                                  : historyItem.old_status === 'in_progress'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                  }`}>
                                  {historyItem.old_status.replace('_', ' ')}
                                </span>
                                <span className="text-gray-400 text-xs">→</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${historyItem.new_status === 'resolved'
                                  ? 'bg-green-100 text-green-700'
                                  : historyItem.new_status === 'in_progress'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                  }`}>
                                  {historyItem.new_status.replace('_', ' ')}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(historyItem.changed_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              Changed by: {historyItem.changed_by_name}
                              {historyItem.comment && (
                                <span className="ml-2 italic">- "{historyItem.comment}"</span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm text-gray-500 border-t border-gray-200 pt-3 mt-3">
                  <div className="flex space-x-4">
                    <span>
                      <span className="font-medium">Reported:</span>{' '}
                      {new Date(issue.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span>
                      <span className="font-medium">Last Updated:</span>{' '}
                      {new Date(issue.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">ID: {issue.id.slice(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
