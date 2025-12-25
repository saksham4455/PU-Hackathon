import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { localStorageService, Issue } from '../lib/localStorage';

export function AdminActionPanel() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      loadIssues();
    }
  }, [user, profile]);

  const loadIssues = async () => {
    try {
      const { issues, error } = await localStorageService.getIssues();
      
      if (error) throw error;
      setIssues(issues);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = issues.filter(issue => 
    statusFilter === 'all' || issue.status === statusFilter
  );

  const handleIssueSelect = (issue: Issue) => {
    setSelectedIssue(issue);
    setNewStatus(issue.status);
    setAdminNotes(issue.admin_notes || '');
    setSuccess(false);
    setError('');
  };

  const handleUpdateStatus = async () => {
    if (!selectedIssue || (newStatus === selectedIssue.status && adminNotes === (selectedIssue.admin_notes || ''))) return;

    setUpdating(true);
    setError('');
    setSuccess(false);

    try {
      let updatedIssue = selectedIssue;

      // Update issue status if changed
      if (newStatus !== selectedIssue.status) {
        const { issue: statusUpdatedIssue, error: statusError } = await localStorageService.updateIssueStatus(
          selectedIssue.id, 
          newStatus as Issue['status']
        );

        if (statusError) throw statusError;
        if (statusUpdatedIssue) updatedIssue = statusUpdatedIssue;
      }

      // Update admin notes if changed
      if (adminNotes !== (selectedIssue.admin_notes || '')) {
        const { issue: notesUpdatedIssue, error: notesError } = await localStorageService.updateIssueAdminNotes(
          selectedIssue.id,
          adminNotes
        );

        if (notesError) throw notesError;
        if (notesUpdatedIssue) updatedIssue = notesUpdatedIssue;
      }

      setSelectedIssue(updatedIssue);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Update the issues list
      setIssues(prevIssues => 
        prevIssues.map(issue => 
          issue.id === selectedIssue.id ? updatedIssue : issue
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update issue');
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

  return (
    <div className="min-h-screen bg-gray-50 flex-grow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Action Panel</h1>
          <p className="text-gray-600">Update issue status and add internal notes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Issue Selection Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Filter className="w-6 h-6 mr-2" />
                Select Issue
              </h2>
              <div className="text-sm text-gray-500">
                {filteredIssues.length} issues
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Issues</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredIssues.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No issues found matching your filter
                </div>
              ) : (
                filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => handleIssueSelect(issue)}
                    className={`p-4 border rounded-lg cursor-pointer transition ${
                      selectedIssue?.id === issue.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {issue.id.slice(0, 8)}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              issue.status
                            )}`}
                          >
                            {getStatusLabel(issue.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 capitalize mb-1">
                          {issue.issue_type}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {issue.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(issue.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Status Update Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Update Status</h2>

            {!selectedIssue ? (
              <div className="text-center text-gray-500 py-12">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Select an issue from the left panel to update its status</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Selected Issue Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Selected Issue</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">ID:</span> {selectedIssue.id.slice(0, 8)}</p>
                    <p><span className="font-medium">Type:</span> {selectedIssue.issue_type}</p>
                    <p><span className="font-medium">Current Status:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedIssue.status)}`}>
                        {getStatusLabel(selectedIssue.status)}
                      </span>
                    </p>
                    <p><span className="font-medium">Description:</span> {selectedIssue.description}</p>
                  </div>
                </div>

                {/* Success/Error Messages */}
                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3 text-green-700">
                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                    <span>Status updated successfully!</span>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-red-700">
                    <AlertCircle className="w-6 h-6 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Status Update Form */}
                <div>
                  <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700 mb-2">
                    New Status
                  </label>
                  <select
                    id="newStatus"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes (e.g., 'Assigned to crew 4', 'Duplicate report')"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <button
                  onClick={handleUpdateStatus}
                  disabled={updating || (newStatus === selectedIssue.status && adminNotes === (selectedIssue.admin_notes || ''))}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  <span>{updating ? 'Updating...' : 'Save Update'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
