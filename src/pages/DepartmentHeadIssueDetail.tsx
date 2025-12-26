import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, TrendingUp, TrendingDown, Clock, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { localStorageService, Issue } from '../lib/localStorage';

export function DepartmentHeadIssueDetail() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'department_head') {
            navigate('/login');
            return;
        }
        loadData();
    }, [user, navigate]);

    const loadData = async () => {
        try {
            const { issues: allIssues } = await localStorageService.getIssues();
            const departmentIssues = allIssues.filter(
                issue => issue.department_id === user?.department_id
            );

            const workersData = await import('../data/department_workers.json');
            const deptWorkers = workersData.department_workers.filter(
                (w: any) => w.department_id === user?.department_id
            );

            setIssues(departmentIssues);
            setWorkers(deptWorkers);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user || user.role !== 'department_head') {
        return null;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
    }

    // Calculate analytics
    const stats = {
        total: issues.length,
        pending: issues.filter(i => i.status === 'pending').length,
        inProgress: issues.filter(i => i.status === 'in_progress').length,
        resolved: issues.filter(i => i.status === 'resolved').length,
        assigned: issues.filter(i => i.assigned_to_worker_id).length,
        unassigned: issues.filter(i => !i.assigned_to_worker_id).length
    };

    const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
    const assignmentRate = stats.total > 0 ? Math.round((stats.assigned / stats.total) * 100) : 0;

    // Calculate average resolution time
    const resolvedIssues = issues.filter(i => i.work_started_at && i.work_completed_at);
    const avgResolutionTime = resolvedIssues.length > 0
        ? Math.round(
            resolvedIssues.reduce((sum, i) => {
                const start = new Date(i.work_started_at!).getTime();
                const end = new Date(i.work_completed_at!).getTime();
                return sum + (end - start) / (1000 * 60 * 60);
            }, 0) / resolvedIssues.length
        )
        : 0;

    // Issue type breakdown
    const issueTypeBreakdown = issues.reduce((acc, issue) => {
        acc[issue.issue_type] = (acc[issue.issue_type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topIssueTypes = Object.entries(issueTypeBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    // Worker performance
    const workerPerformance = workers.map(worker => {
        const workerIssues = issues.filter(i => i.assigned_to_worker_id === worker.id);
        const completed = workerIssues.filter(i => i.status === 'resolved').length;
        return {
            name: worker.full_name,
            assigned: workerIssues.length,
            completed,
            rate: workerIssues.length > 0 ? Math.round((completed / workerIssues.length) * 100) : 0
        };
    }).sort((a, b) => b.completed - a.completed);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <button
                    onClick={() => navigate('/dept-head/dashboard')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Dashboard</span>
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Department Analytics</h1>
                    <p className="mt-2 text-gray-600">{user.department_name} - Performance Overview</p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-600">Total Issues</p>
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                        <p className="text-xs text-gray-500 mt-1">All time</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-600">Resolution Rate</p>
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{resolutionRate}%</p>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${resolutionRate}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-600">Avg Resolution Time</p>
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{avgResolutionTime}h</p>
                        <p className="text-xs text-gray-500 mt-1">Per issue</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-600">Assignment Rate</p>
                            <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{assignmentRate}%</p>
                        <p className="text-xs text-gray-500 mt-1">{stats.unassigned} pending</p>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Status Distribution */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Pending</span>
                                    <span className="text-sm font-semibold text-gray-900">{stats.pending}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-red-500 h-3 rounded-full"
                                        style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">In Progress</span>
                                    <span className="text-sm font-semibold text-gray-900">{stats.inProgress}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-yellow-500 h-3 rounded-full"
                                        style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Resolved</span>
                                    <span className="text-sm font-semibold text-gray-900">{stats.resolved}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-green-500 h-3 rounded-full"
                                        style={{ width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Issue Types */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Issue Types</h3>
                        <div className="space-y-3">
                            {topIssueTypes.map(([type, count], index) => (
                                <div key={type} className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 capitalize">
                                            {type.replace('_', ' ')}
                                        </p>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ width: `${(count / stats.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Worker Performance */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Worker Performance</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Worker</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Assigned</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Completed</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Success Rate</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Performance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {workerPerformance.map((worker, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{worker.name}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{worker.assigned}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{worker.completed}</td>
                                        <td className="py-3 px-4 text-sm font-semibold text-gray-900">{worker.rate}%</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${worker.rate >= 75 ? 'bg-green-500' :
                                                                worker.rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${worker.rate}%` }}
                                                    />
                                                </div>
                                                {worker.rate >= 75 ? (
                                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                                ) : worker.rate < 50 ? (
                                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Insights & Recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Actionable Insights */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6 border border-blue-200">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-blue-600 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-blue-900">Key Insights</h3>
                        </div>
                        <div className="space-y-3">
                            {resolutionRate >= 75 && (
                                <div className="flex items-start gap-2 text-sm text-blue-800">
                                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                                    <p><span className="font-semibold">Excellent performance!</span> Your department has a {resolutionRate}% resolution rate.</p>
                                </div>
                            )}
                            {resolutionRate < 50 && (
                                <div className="flex items-start gap-2 text-sm text-blue-800">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-600" />
                                    <p><span className="font-semibold">Attention needed:</span> Resolution rate is at {resolutionRate}%. Consider redistributing workload.</p>
                                </div>
                            )}
                            {stats.unassigned > 5 && (
                                <div className="flex items-start gap-2 text-sm text-blue-800">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-600" />
                                    <p><span className="font-semibold">Assignment backlog:</span> {stats.unassigned} issues pending assignment.</p>
                                </div>
                            )}
                            {avgResolutionTime > 0 && avgResolutionTime < 24 && (
                                <div className="flex items-start gap-2 text-sm text-blue-800">
                                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                                    <p><span className="font-semibold">Fast response:</span> Average resolution time of {avgResolutionTime}h is excellent!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6 border border-purple-200">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-purple-600 rounded-lg">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-purple-900">Recommendations</h3>
                        </div>
                        <div className="space-y-3">
                            {workerPerformance.some(w => w.rate < 50) && (
                                <div className="flex items-start gap-2 text-sm text-purple-800">
                                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-1.5 flex-shrink-0" />
                                    <p><span className="font-semibold">Training opportunity:</span> Some workers need additional training or mentorship.</p>
                                </div>
                            )}
                            {assignmentRate < 70 && (
                                <div className="flex items-start gap-2 text-sm text-purple-800">
                                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-1.5 flex-shrink-0" />
                                    <p><span className="font-semibold">Improve assignment:</span> Only {assignmentRate}% of issues are assigned.</p>
                                </div>
                            )}
                            <div className="flex items-start gap-2 text-sm text-purple-800">
                                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-1.5 flex-shrink-0" />
                                <p><span className="font-semibold">Regular reviews:</span> Schedule weekly team meetings to discuss progress.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Alerts */}
                {(stats.pending > stats.total * 0.4 || stats.unassigned > 10) && (
                    <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow p-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-lg font-semibold text-red-900 mb-2">Performance Alerts</h3>
                                <div className="space-y-2 text-sm text-red-800">
                                    {stats.pending > stats.total * 0.4 && (
                                        <p>⚠️ High pending rate: {Math.round((stats.pending / stats.total) * 100)}% of issues are still pending.</p>
                                    )}
                                    {stats.unassigned > 10 && (
                                        <p>⚠️ Assignment backlog: {stats.unassigned} unassigned issues require immediate attention.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
