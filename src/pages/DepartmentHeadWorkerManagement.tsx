import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Users, TrendingUp, Award, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { localStorageService, Issue } from '../lib/localStorage';

interface Worker {
    id: string;
    email: string;
    full_name: string;
    worker_id: string;
    specialization: string;
    phone: string;
    department_id: string;
    department_name: string;
    active_issues?: string[];
    completed_issues_count: number;
    average_resolution_time: number;
}

export function DepartmentHeadWorkerManagement() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [issues, setIssues] = useState<Issue[]>([]);
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
            // Load workers
            const workersData = await import('../data/department_workers.json');
            const deptWorkers = workersData.department_workers.filter(
                (w: any) => w.department_id === user?.department_id
            );

            // Load issues
            const { issues: allIssues } = await localStorageService.getIssues();
            const departmentIssues = allIssues.filter(
                issue => issue.department_id === user?.department_id
            );

            // Calculate worker stats
            const workersWithStats = deptWorkers.map((worker: any) => {
                const workerIssues = departmentIssues.filter(i => i.assigned_to_worker_id === worker.id);
                const completedIssues = workerIssues.filter(i => i.status === 'resolved');

                const avgTime = completedIssues.length > 0
                    ? Math.round(
                        completedIssues.reduce((sum, i) => {
                            if (i.work_started_at && i.work_completed_at) {
                                const start = new Date(i.work_started_at).getTime();
                                const end = new Date(i.work_completed_at).getTime();
                                return sum + (end - start) / (1000 * 60 * 60);
                            }
                            return sum;
                        }, 0) / completedIssues.length
                    )
                    : 0;

                return {
                    ...worker,
                    active_issues: workerIssues.filter(i => i.status !== 'resolved').map(i => i.id),
                    completed_issues_count: completedIssues.length,
                    average_resolution_time: avgTime
                };
            });

            setWorkers(workersWithStats);
            setIssues(departmentIssues);
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

    const totalAssigned = issues.filter(i => i.assigned_to_worker_id).length;
    const totalCompleted = issues.filter(i => i.status === 'resolved').length;
    const completionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

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
                    <h1 className="text-3xl font-bold text-gray-900">Worker Management</h1>
                    <p className="mt-2 text-gray-600">{user.department_name} - Team Performance</p>
                </div>

                {/* Department Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Total Workers</p>
                                <p className="text-2xl font-bold text-gray-900">{workers.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Active Issues</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {workers.reduce((sum, w) => sum + (w.active_issues?.length || 0), 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Completed</p>
                                <p className="text-2xl font-bold text-gray-900">{totalCompleted}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Completion Rate</p>
                                <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Workers List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
                        <p className="text-sm text-gray-600 mt-1">Monitor worker performance and workload</p>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {workers.map((worker) => (
                            <div key={worker.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                {worker.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{worker.full_name}</h3>
                                                <p className="text-sm text-gray-600">{worker.worker_id} • {worker.specialization}</p>
                                            </div>
                                        </div>

                                        <div className="ml-15 grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Active Issues</p>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {worker.active_issues?.length || 0}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Completed</p>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {worker.completed_issues_count}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Avg Time</p>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {worker.average_resolution_time}h
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="ml-15 mt-3 flex items-center gap-2 text-sm text-gray-600">
                                            <span>📧 {worker.email}</span>
                                            <span>•</span>
                                            <span>📱 {worker.phone}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {worker.active_issues && worker.active_issues.length > 0 ? (
                                            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                                                Busy
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                                Available
                                            </span>
                                        )}

                                        {worker.completed_issues_count > 10 && (
                                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold flex items-center gap-1">
                                                <Award className="w-3 h-3" />
                                                Top Performer
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Active Issues List */}
                                {worker.active_issues && worker.active_issues.length > 0 && (
                                    <div className="ml-15 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <p className="text-xs font-semibold text-blue-900 mb-2">Current Assignments:</p>
                                        <div className="space-y-1">
                                            {worker.active_issues.slice(0, 3).map((issueId) => {
                                                const issue = issues.find(i => i.id === issueId);
                                                return issue ? (
                                                    <div key={issueId} className="text-xs text-blue-800">
                                                        • {issue.issue_type.replace('_', ' ')} - {issue.location_address?.substring(0, 40) || 'Location pending'}
                                                    </div>
                                                ) : null;
                                            })}
                                            {worker.active_issues.length > 3 && (
                                                <div className="text-xs text-blue-600 font-medium">
                                                    +{worker.active_issues.length - 3} more issues
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Performance Insights */}
                <div className="mt-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                    <h3 className="text-xl font-bold mb-4">Team Insights</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm opacity-90 mb-1">Most Productive Worker</p>
                            <p className="text-lg font-semibold">
                                {workers.length > 0
                                    ? workers.reduce((max, w) => w.completed_issues_count > max.completed_issues_count ? w : max, workers[0]).full_name
                                    : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm opacity-90 mb-1">Fastest Resolution</p>
                            <p className="text-lg font-semibold">
                                {workers.filter(w => w.average_resolution_time > 0).length > 0
                                    ? `${Math.min(...workers.filter(w => w.average_resolution_time > 0).map(w => w.average_resolution_time))}h avg`
                                    : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm opacity-90 mb-1">Team Workload</p>
                            <p className="text-lg font-semibold">
                                {workers.reduce((sum, w) => sum + (w.active_issues?.length || 0), 0)} active issues
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
