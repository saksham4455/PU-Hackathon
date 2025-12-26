import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wrench, ClipboardList, CheckCircle, Clock, Camera, AlertTriangle, History } from 'lucide-react';
import { localStorageService, Issue } from '../lib/localStorage';

export function DepartmentWorkerDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'department_worker') {
            navigate('/login');
            return;
        }
        loadIssues();
    }, [user, navigate]);

    const loadIssues = async () => {
        try {
            const { issues: allIssues } = await localStorageService.getIssues();

            // Filter issues assigned to this worker
            const workerIssues = allIssues.filter(
                issue => issue.assigned_to_worker_id === user?.id
            );

            setIssues(workerIssues);
        } catch (error) {
            console.error('Error loading issues:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartWork = async (issueId: string) => {
        try {
            const issueIndex = issues.findIndex(i => i.id === issueId);
            if (issueIndex === -1) return;

            const updatedIssue = {
                ...issues[issueIndex],
                work_started_at: new Date().toISOString(),
                status: 'in_progress' as const
            };

            const newIssues = [...issues];
            newIssues[issueIndex] = updatedIssue;
            setIssues(newIssues);

            console.log('Started work on issue', issueId);
        } catch (error) {
            console.error('Error starting work:', error);
        }
    };

    if (!user || user.role !== 'department_worker') {
        return null;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
    }

    const stats = {
        total: issues.length,
        pending: issues.filter(i => !i.work_started_at).length,
        inProgress: issues.filter(i => i.work_started_at && !i.work_completed_at).length,
        completed: issues.filter(i => i.work_completed_at).length
    };

    const avgTime = issues.filter(i => i.work_started_at && i.work_completed_at).length > 0
        ? Math.round(
            issues
                .filter(i => i.work_started_at && i.work_completed_at)
                .reduce((sum, i) => {
                    const start = new Date(i.work_started_at!).getTime();
                    const end = new Date(i.work_completed_at!).getTime();
                    return sum + (end - start) / (1000 * 60 * 60);
                }, 0) / issues.filter(i => i.work_started_at && i.work_completed_at).length
        )
        : 0;

    const completedIssues = issues.filter(i => i.work_completed_at).sort((a, b) =>
        new Date(b.work_completed_at!).getTime() - new Date(a.work_completed_at!).getTime()
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Worker Dashboard</h1>
                    <p className="mt-2 text-gray-600">
                        {user.full_name} ({user.worker_id}) - {user.specialization}
                    </p>
                    <p className="text-sm text-gray-500">{user.department_name}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <ClipboardList className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Assigned Issues</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">In Progress</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Completed</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Wrench className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Avg Time</p>
                                <p className="text-2xl font-bold text-gray-900">{avgTime}h</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Card */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Your Performance</h3>
                            <p className="text-sm opacity-90">
                                {stats.completed} issues resolved • {stats.inProgress} in progress
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl font-bold">
                                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                            </div>
                            <p className="text-sm opacity-90">Completion Rate</p>
                        </div>
                    </div>
                </div>

                {/* Issues List */}
                <div className="bg-white rounded-lg shadow mb-8">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">My Assigned Issues</h2>
                        <p className="text-sm text-gray-600 mt-1">Click on an issue to add photos and update status</p>
                    </div>

                    {issues.filter(i => !i.work_completed_at).length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No active issues</p>
                            <p className="text-sm mt-2">All your assigned work is completed!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {issues.filter(i => !i.work_completed_at).map((issue) => (
                                <div key={issue.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                                                    {issue.issue_type.replace('_', ' ')}
                                                </h3>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${issue.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                                        issue.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                            issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-green-100 text-green-800'
                                                    }`}>
                                                    {issue.priority} priority
                                                </span>
                                                {issue.work_started_at && !issue.work_completed_at && (
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        In Progress
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-600 mb-3">{issue.description}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span>📍 {issue.location_address || 'Location not specified'}</span>
                                                <span>📅 {new Date(issue.created_at).toLocaleDateString()}</span>
                                                {issue.assigned_at && (
                                                    <span>👤 Assigned {new Date(issue.assigned_at).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 ml-4">
                                            {!issue.work_started_at ? (
                                                <button
                                                    onClick={() => handleStartWork(issue.id)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                                >
                                                    Start Work
                                                </button>
                                            ) : null}
                                            <button
                                                onClick={() => navigate(`/worker/issues/${issue.id}`)}
                                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                                            >
                                                <Camera className="w-4 h-4" />
                                                Add Photos
                                            </button>
                                        </div>
                                    </div>

                                    {issue.work_started_at && !issue.work_completed_at && (
                                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                            <div className="flex items-center gap-2 text-sm text-blue-800">
                                                <AlertTriangle className="w-4 h-4" />
                                                <span className="font-medium">Action Required:</span>
                                                <span>Upload before & after photos to complete this issue</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Work History */}
                {completedIssues.length > 0 && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <History className="w-5 h-5 text-gray-600" />
                                <h2 className="text-xl font-bold text-gray-900">Work History</h2>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Your completed work timeline ({completedIssues.length} completed)</p>
                        </div>

                        <div className="p-6">
                            <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                                {completedIssues.slice(0, 10).map((issue, index) => {
                                    const workDuration = issue.work_started_at && issue.work_completed_at
                                        ? Math.round((new Date(issue.work_completed_at).getTime() - new Date(issue.work_started_at).getTime()) / (1000 * 60 * 60))
                                        : 0;

                                    return (
                                        <div key={issue.id} className="relative pl-6">
                                            <div className="absolute -left-[13px] top-1 w-6 h-6 rounded-full border-2 border-white bg-green-500 shadow-sm flex items-center justify-center">
                                                <CheckCircle className="w-3 h-3 text-white" />
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900 capitalize">
                                                            {issue.issue_type.replace('_', ' ')}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{issue.description}</p>
                                                    </div>
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold ml-4">
                                                        Completed
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
                                                    <div>
                                                        <span className="text-gray-500">Completed:</span>
                                                        <p className="text-gray-900 font-medium">{new Date(issue.work_completed_at!).toLocaleDateString()}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Duration:</span>
                                                        <p className="text-gray-900 font-medium">{workDuration}h</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Priority:</span>
                                                        <p className={`capitalize font-semibold ${issue.priority === 'critical' ? 'text-red-600' :
                                                                issue.priority === 'high' ? 'text-orange-600' :
                                                                    issue.priority === 'medium' ? 'text-yellow-600' :
                                                                        'text-green-600'
                                                            }`}>
                                                            {issue.priority}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Photos:</span>
                                                        <p className="text-gray-900 font-medium">
                                                            {(issue.before_photos?.length || 0) + (issue.after_photos?.length || 0)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {issue.work_notes && (
                                                    <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-100">
                                                        <p className="text-xs text-blue-800">
                                                            <span className="font-semibold">Notes:</span> {issue.work_notes.substring(0, 100)}
                                                            {issue.work_notes.length > 100 && '...'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {completedIssues.length > 10 && (
                                <div className="mt-6 text-center">
                                    <p className="text-sm text-gray-500">
                                        Showing 10 of {completedIssues.length} completed issues
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
