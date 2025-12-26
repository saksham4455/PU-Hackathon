import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, ClipboardList, TrendingUp, AlertCircle, CheckCircle2, Clock, UserCheck } from 'lucide-react';
import { localStorageService, Issue } from '../lib/localStorage';

export function DepartmentHeadDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user || user.role !== 'department_head') {
            navigate('/login');
            return;
        }
        loadData();
    }, [user, navigate]);

    const loadData = async () => {
        try {
            // Load all issues
            const { issues: allIssues } = await localStorageService.getIssues();

            // Filter issues for this department
            const departmentIssues = allIssues.filter(
                issue => issue.department_id === user?.department_id ||
                    (!issue.department_id && getDepartmentForIssueType(issue.issue_type) === user?.department_name)
            );

            setIssues(departmentIssues);

            // Load workers from JSON (in real app, this would be an API call)
            const workersData = await import('../data/department_workers.json');
            const deptWorkers = workersData.department_workers.filter(
                (w: any) => w.department_id === user?.department_id
            );
            setWorkers(deptWorkers);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDepartmentForIssueType = (issueType: string): string => {
        const mapping: Record<string, string> = {
            'pothole': 'Road Maintenance',
            'broken_sidewalk': 'Road Maintenance',
            'garbage': 'Sanitation',
            'streetlight': 'Electrical Services',
            'water_leak': 'Water & Sewage',
            'drainage': 'Water & Sewage',
            'traffic_signal': 'Traffic Management',
            'parking_violation': 'Traffic Management',
            'street_sign': 'Signage & Markings',
            'tree_maintenance': 'Parks & Horticulture',
            'graffiti': 'Anti-Vandalism',
            'noise_complaint': 'Public Safety',
            'other': 'General Services'
        };
        return mapping[issueType] || 'General Services';
    };

    const handleAssignWorker = async (issueId: string, workerId: string) => {
        const worker = workers.find(w => w.id === workerId);
        if (!worker) return;

        try {
            const issueIndex = issues.findIndex(i => i.id === issueId);
            if (issueIndex === -1) return;

            const updatedIssue = {
                ...issues[issueIndex],
                assigned_to_worker_id: worker.id,
                assigned_to_worker_name: worker.full_name,
                assigned_by: user?.full_name,
                assigned_at: new Date().toISOString(),
                department_id: user?.department_id,
                department_name: user?.department_name,
                status: 'in_progress' as const
            };

            // Update local state
            const newIssues = [...issues];
            newIssues[issueIndex] = updatedIssue;
            setIssues(newIssues);

            // In a real app, this would call an API
            console.log('Assigned issue', issueId, 'to worker', worker.full_name);
        } catch (error) {
            console.error('Error assigning worker:', error);
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

    // Filter issues
    const filteredIssues = issues.filter(issue => {
        const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || issue.priority === priorityFilter;
        const matchesSearch = searchTerm === '' ||
            issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.issue_type.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesPriority && matchesSearch;
    });

    const stats = {
        total: issues.length,
        pending: issues.filter(i => !i.assigned_to_worker_id).length,
        inProgress: issues.filter(i => i.status === 'in_progress').length,
        resolved: issues.filter(i => i.status === 'resolved').length,
        activeWorkers: workers.filter(w => issues.some(i => i.assigned_to_worker_id === w.id && i.status === 'in_progress')).length
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Department Head Dashboard</h1>
                    <p className="mt-2 text-gray-600">
                        {user.full_name} - {user.department_name}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <ClipboardList className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Total Issues</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Pending Assignment</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Clock className="w-6 h-6 text-yellow-600" />
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
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Resolved</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Active Workers</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.activeWorkers}/{workers.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <button
                        onClick={() => navigate('/dept-head/workers')}
                        className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-left"
                    >
                        <UserCheck className="w-8 h-8 text-blue-600 mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900">Manage Workers</h3>
                        <p className="text-sm text-gray-600 mt-1">View and manage your team</p>
                    </button>

                    <button
                        onClick={() => navigate('/dept-head/analytics')}
                        className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-left"
                    >
                        <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900">Department Analytics</h3>
                        <p className="text-sm text-gray-600 mt-1">View performance metrics</p>
                    </button>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow text-white">
                        <div className="text-3xl font-bold">{Math.round((stats.resolved / (stats.total || 1)) * 100)}%</div>
                        <p className="text-sm mt-1 opacity-90">Resolution Rate</p>
                    </div>
                </div>

                {/* Issues List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">Department Issues</h2>
                        <p className="text-sm text-gray-600 mt-1">Assign issues to workers and track progress</p>

                        {/* Filters */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Priorities</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search issues..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredIssues.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            {issues.length === 0 ? 'No issues assigned to your department yet' : 'No issues match your filters'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredIssues.map((issue) => (
                                        <tr key={issue.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900 capitalize">
                                                    {issue.issue_type.replace('_', ' ')}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                    {issue.description}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${issue.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                                    issue.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                        issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                    }`}>
                                                    {issue.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${issue.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                    issue.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {issue.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {issue.assigned_to_worker_name ? (
                                                    <div className="text-sm text-gray-900">{issue.assigned_to_worker_name}</div>
                                                ) : (
                                                    <select
                                                        onChange={(e) => handleAssignWorker(issue.id, e.target.value)}
                                                        className="text-sm border-gray-300 rounded-md"
                                                        defaultValue=""
                                                    >
                                                        <option value="" disabled>Assign worker...</option>
                                                        {workers.map((worker) => (
                                                            <option key={worker.id} value={worker.id}>
                                                                {worker.full_name} ({worker.specialization})
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => navigate(`/dept-head/issues/${issue.id}`)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
