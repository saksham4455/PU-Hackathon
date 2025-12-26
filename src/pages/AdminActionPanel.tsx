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
    if (user && profile?.role === 'super_admin') {
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

  if (!user || profile?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center glass-panel p-8 animate-fade-in">
          <p className="text-xl text-gray-800 mb-4 font-bold">Access Denied: Admin Only</p>
          <button
            onClick={() => navigate('/home')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/30 transition transform hover:-translate-y-0.5"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-xl text-gray-600 font-medium animate-pulse">Loading Panel...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex-grow py-8 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-200/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-200/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <button
          onClick={() => navigate('/admin')}
          className="group flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors duration-200"
        >
          <div className="p-2 bg-white/50 rounded-full group-hover:bg-blue-50 transition-colors shadow-sm cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-medium">Back to Dashboard</span>
        </button>

        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Admin Action Panel</h1>
          <p className="text-gray-600 text-lg">Streamlined issue management and status updates</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Issue Selection Panel */}
          <div className="lg:col-span-5 glass-panel p-0 overflow-hidden flex flex-col h-[calc(100vh-200px)] min-h-[600px] animate-slide-up shadow-xl border-white/40" style={{ animationDelay: '0.2s' }}>
            <div className="p-6 border-b border-white/20 bg-gradient-to-b from-white/40 to-white/20 backdrop-blur-md z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Filter className="w-5 h-5" />
                  </div>
                  Issue Registry
                </h2>
                <span className="px-3 py-1 bg-white/50 text-gray-600 text-xs font-bold rounded-full border border-white/40 shadow-sm">
                  {filteredIssues.length} found
                </span>
              </div>

              <div className="space-y-3">
                {/* Search (Visual Placeholder - filtering could be added to filteredIssues logic easily if desired, but keeping scope focused on UI Redesign as requested) */}
                {/* For now, let's keep the functional filter but style it better */}

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:bg-white/80 text-sm font-medium appearance-none shadow-sm cursor-pointer"
                  >
                    <option value="all">View All Issues</option>
                    <option value="pending">Status: Pending</option>
                    <option value="in_progress">Status: In Progress</option>
                    <option value="resolved">Status: Resolved</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-gray-50/30">
              {filteredIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <Filter className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No Issues Found</h3>
                  <p className="text-sm text-gray-500 max-w-[200px]">Try adjusting your filters to see more results.</p>
                </div>
              ) : (
                filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => handleIssueSelect(issue)}
                    className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-300 border group ${selectedIssue?.id === issue.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30 shadow-lg border-transparent translate-x-1'
                      : 'bg-white border-white/60 hover:border-blue-200 hover:shadow-lg hover:-translate-y-0.5 text-gray-700 shadow-sm'
                      }`}
                  >
                    {/* Status Indicator Dot for unselected items */}
                    {selectedIssue?.id !== issue.id && (
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 rounded-r-lg transition-all duration-300 ${issue.status === 'resolved' ? 'bg-green-500' :
                        issue.status === 'in_progress' ? 'bg-yellow-500' : 'bg-red-500'
                        } group-hover:h-full group-hover:rounded-l-lg group-hover:rounded-r-none opacity-50 group-hover:opacity-100`}></div>
                    )}

                    <div className="flex justify-between items-start relative z-10 pl-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${selectedIssue?.id === issue.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                            #{issue.id.slice(0, 6)}
                          </span>
                          <span className="flex-grow"></span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${selectedIssue?.id === issue.id
                            ? 'bg-white/20 text-white'
                            : getStatusColor(issue.status).replace('bg-', 'bg-opacity-50 bg-')
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${selectedIssue?.id === issue.id ? 'bg-white' : 'bg-current'}`}></div>
                            {issue.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          {/* Icon based on type? For now generic or type initial */}
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shadow-sm ${selectedIssue?.id === issue.id
                            ? 'bg-white/20 text-white'
                            : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-500 border border-gray-100'
                            }`}>
                            {issue.issue_type.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className={`text-sm font-bold capitalize mb-0.5 truncate ${selectedIssue?.id === issue.id ? 'text-white' : 'text-gray-900 group-hover:text-blue-600 transition-colors'}`}>
                              {issue.issue_type.replace('_', ' ')}
                            </h3>
                            <p className={`text-xs truncate max-w-[200px] ${selectedIssue?.id === issue.id ? 'text-blue-100' : 'text-gray-500'}`}>
                              {issue.description}
                            </p>
                          </div>
                        </div>

                        <div className={`mt-3 pt-3 border-t ${selectedIssue?.id === issue.id ? 'border-white/20' : 'border-gray-100'} flex items-center justify-between`}>
                          <span className={`text-[10px] flex items-center gap-1.5 ${selectedIssue?.id === issue.id ? 'text-blue-100' : 'text-gray-400'}`}>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {new Date(issue.created_at).toLocaleDateString()}
                          </span>

                          {/* Chevright icon */}
                          <svg className={`w-4 h-4 transition-transform ${selectedIssue?.id === issue.id ? 'text-white translate-x-1' : 'text-gray-300 group-hover:text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Status Update Panel */}
          <div className="lg:col-span-7 glass-panel p-8 animate-slide-up h-fit" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="p-2 bg-blue-100 text-blue-600 rounded-lg shadow-sm">
                <CheckCircle className="w-6 h-6" />
              </span>
              Update Status & Notes
            </h2>

            {!selectedIssue ? (
              <div className="text-center text-gray-500 py-16 px-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Filter className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Issue Selected</h3>
                <p className="max-w-xs mx-auto">Select an issue from the list on the left to view details and update its status.</p>
              </div>
            ) : (
              <div className="space-y-8 animate-fade-in">
                {/* Selected Issue Info */}
                <div className="bg-blue-50/60 backdrop-blur-sm rounded-xl p-5 border border-blue-100/60 shadow-inner">
                  <div className="flex items-center justify-between mb-4 border-b border-blue-200/50 pb-3">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      Selected Issue Details
                    </h3>
                    <span className="font-mono text-xs text-blue-600 bg-blue-100/80 px-2 py-1 rounded">
                      ID: {selectedIssue.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-500 text-xs uppercase font-bold tracking-wider mb-1">Type</p>
                      <p className="font-medium text-gray-800 capitalize">{selectedIssue.issue_type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-blue-500 text-xs uppercase font-bold tracking-wider mb-1">Current Status</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase ${getStatusColor(selectedIssue.status)} border border-current border-opacity-20`}>
                        {getStatusLabel(selectedIssue.status)}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-blue-500 text-xs uppercase font-bold tracking-wider mb-1">Description</p>
                      <p className="text-gray-700 leading-relaxed bg-white/60 p-3 rounded-lg border border-blue-100/50">
                        {selectedIssue.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Success/Error Messages */}
                {success && (
                  <div className="p-4 bg-green-50/90 backdrop-blur-md border border-green-200 rounded-xl flex items-start space-x-3 text-green-800 shadow-sm animate-fade-in">
                    <CheckCircle className="w-6 h-6 flex-shrink-0 text-green-600" />
                    <div>
                      <span className="font-bold">Success!</span>
                      <p className="text-sm opacity-90">The issue status and notes have been updated.</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50/90 backdrop-blur-md border border-red-200 rounded-xl flex items-start space-x-3 text-red-800 shadow-sm animate-fade-in">
                    <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-600" />
                    <div>
                      <span className="font-bold">Error</span>
                      <p className="text-sm opacity-90">{error}</p>
                    </div>
                  </div>
                )}

                {/* Status Update Form */}
                <div className="space-y-6 bg-white/40 p-6 rounded-2xl border border-white/50 shadow-sm">
                  <div>
                    <label htmlFor="newStatus" className="block text-sm font-bold text-gray-700 mb-2">
                      New Status
                    </label>
                    <div className="relative">
                      <select
                        id="newStatus"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="adminNotes" className="block text-sm font-bold text-gray-700 mb-2">
                      Internal Admin Notes
                      <span className="ml-2 font-normal text-xs text-gray-400 italic">(Only visible to admins)</span>
                    </label>
                    <textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add internal notes (e.g., 'Assigned to crew 4', 'Duplicate report')..."
                      rows={5}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm transition-all text-sm leading-relaxed"
                    />
                  </div>

                  <button
                    onClick={handleUpdateStatus}
                    disabled={updating || (newStatus === selectedIssue.status && adminNotes === (selectedIssue.admin_notes || ''))}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    {updating ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    <span>{updating ? 'Saving Changes...' : 'Save Update & Notes'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
