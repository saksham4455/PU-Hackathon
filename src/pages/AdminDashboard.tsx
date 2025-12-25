import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { localStorageService, Issue } from '../lib/localStorage';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [dateRange, setDateRange] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      loadIssues();
    }
  }, [user, profile]);

  useEffect(() => {
    let filtered = [...issues];

    // Search filtering
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((issue) =>
        issue.description.toLowerCase().includes(query) ||
        issue.id.toLowerCase().includes(query) ||
        (issue.location_address && issue.location_address.toLowerCase().includes(query)) ||
        issue.issue_type.toLowerCase().includes(query)
      );
    }

    // Status filtering
    if (statusFilter !== 'all') {
      filtered = filtered.filter((issue) => issue.status === statusFilter);
    }

    // Type filtering
    if (typeFilter !== 'all') {
      filtered = filtered.filter((issue) => issue.issue_type === typeFilter);
    }

    // Priority filtering
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((issue) => issue.priority === priorityFilter);
    }

    // Date range filtering
    if (dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter((issue) => new Date(issue.created_at) >= filterDate);
    }

    // Sorting
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    setFilteredIssues(filtered);
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [issues, statusFilter, typeFilter, priorityFilter, sortBy, dateRange, searchQuery]);

  const loadIssues = async () => {
    try {
      const { issues, error } = await localStorageService.getIssues();

      if (error) throw error;

      // Keep all issues including duplicates to show batch reporting
      setIssues(issues);
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
    return status ? status.replace('_', ' ').toUpperCase() : '';
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
    return priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'None';
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

  // Handler functions for card clicks
  const handleCardClick = (cardType: string, value: string | null) => {
    if (activeCard === cardType) {
      // Reset filters if clicking the same card
      setActiveCard(null);
      setStatusFilter('all');
      setPriorityFilter('all');
      setDateRange('all');
    } else {
      setActiveCard(cardType);

      // Apply appropriate filter based on card type
      if (cardType === 'all') {
        setStatusFilter('all');
        setPriorityFilter('all');
        setDateRange('all');
      } else if (cardType.startsWith('status-')) {
        setStatusFilter(value || 'all');
        setPriorityFilter('all');
        setDateRange('all');
      } else if (cardType.startsWith('priority-')) {
        setPriorityFilter(value || 'all');
        setStatusFilter('all');
        setDateRange('all');
      } else if (cardType === 'recent') {
        setDateRange('week');
        setStatusFilter('all');
        setPriorityFilter('all');
      }
    }
  };

  // Calculate comprehensive statistics
  const stats = {
    total: issues.length,
    pending: issues.filter((i) => i.status === 'pending').length,
    inProgress: issues.filter((i) => i.status === 'in_progress').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,

    // Resolution rate
    resolutionRate: issues.length > 0 ? Math.round((issues.filter((i) => i.status === 'resolved').length / issues.length) * 100) : 0,

    // Average resolution time (for resolved issues)
    averageResolutionTime: (() => {
      const resolvedIssues = issues.filter((i) => i.status === 'resolved');
      if (resolvedIssues.length === 0) return 0;

      const totalDays = resolvedIssues.reduce((sum, issue) => {
        const created = new Date(issue.created_at);
        const updated = new Date(issue.updated_at);
        const daysDiff = Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return sum + daysDiff;
      }, 0);

      return Math.round(totalDays / resolvedIssues.length);
    })(),

    // Issues by priority
    priorityStats: {
      critical: issues.filter((i) => i.priority === 'critical').length,
      high: issues.filter((i) => i.priority === 'high').length,
      medium: issues.filter((i) => i.priority === 'medium').length,
      low: issues.filter((i) => i.priority === 'low').length,
    },

    // Issues by type
    typeStats: issues.reduce((acc, issue) => {
      acc[issue.issue_type] = (acc[issue.issue_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),

    // Recent activity (last 7 days)
    recentActivity: issues.filter((i) => {
      const issueDate = new Date(i.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return issueDate >= weekAgo;
    }).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex-grow">
      {/* Fixed left column */}
      <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 bg-gray-50 shadow-lg border-r border-gray-200 z-10 overflow-y-auto">
        <div className="p-3 space-y-3">
          {/* Summary Stats */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-gray-900">Issue Overview</h3>
            <button
              onClick={() => handleCardClick('all', null)}
              className={`w-full bg-white rounded-lg shadow p-2 transition-all ${activeCard === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Issues</span>
                <span className="text-xl font-bold text-gray-900">{stats.total}</span>
              </div>
            </button>
            <button
              onClick={() => handleCardClick('status-pending', 'pending')}
              className={`w-full bg-white rounded-lg shadow p-2 transition-all ${activeCard === 'status-pending' ? 'ring-2 ring-red-500 bg-red-50' : 'hover:shadow-md'
                }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Issues</span>
                <span className="text-xl font-bold text-red-600">{stats.pending}</span>
              </div>
            </button>
            <button
              onClick={() => handleCardClick('status-progress', 'in_progress')}
              className={`w-full bg-white rounded-lg shadow p-2 transition-all ${activeCard === 'status-progress' ? 'ring-2 ring-yellow-500 bg-yellow-50' : 'hover:shadow-md'
                }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">In Progress</span>
                <span className="text-xl font-bold text-yellow-600">{stats.inProgress}</span>
              </div>
            </button>
            <button
              onClick={() => handleCardClick('status-resolved', 'resolved')}
              className={`w-full bg-white rounded-lg shadow p-2 transition-all ${activeCard === 'status-resolved' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:shadow-md'
                }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Resolved Issues</span>
                <span className="text-xl font-bold text-green-600">{stats.resolved}</span>
              </div>
            </button>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-gray-900">Performance</h3>
            <div className="bg-white rounded-lg shadow p-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Resolution Rate</span>
                <span className="text-xl font-bold text-blue-600">{stats.resolutionRate}%</span>
              </div>
              <div className="text-xs text-gray-500">Issues resolved</div>
            </div>
            <div className="bg-white rounded-lg shadow p-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Avg Resolution Time</span>
                <span className="text-xl font-bold text-purple-600">{stats.averageResolutionTime}</span>
              </div>
              <div className="text-xs text-gray-500">Days to resolve</div>
            </div>
            <button
              onClick={() => handleCardClick('recent', 'week')}
              className={`w-full bg-white rounded-lg shadow p-2 transition-all ${activeCard === 'recent' ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:shadow-md'
                }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Recent Activity</span>
                <span className="text-xl font-bold text-indigo-600">{stats.recentActivity}</span>
              </div>
              <div className="text-xs text-gray-500">Issues this week</div>
            </button>
          </div>

          {/* Priority Breakdown */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-gray-900">Priority Breakdown</h3>
            <button
              onClick={() => handleCardClick('priority-critical', 'critical')}
              className={`w-full bg-white rounded-lg shadow p-2 transition-all ${activeCard === 'priority-critical' ? 'ring-2 ring-red-500 bg-red-50' : 'hover:shadow-md'
                }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Critical Priority</span>
                <span className="text-lg font-bold text-red-600">{stats.priorityStats.critical}</span>
              </div>
            </button>
            <button
              onClick={() => handleCardClick('priority-high', 'high')}
              className={`w-full bg-white rounded-lg shadow p-2 transition-all ${activeCard === 'priority-high' ? 'ring-2 ring-orange-500 bg-orange-50' : 'hover:shadow-md'
                }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">High Priority</span>
                <span className="text-lg font-bold text-orange-600">{stats.priorityStats.high}</span>
              </div>
            </button>
            <button
              onClick={() => handleCardClick('priority-medium', 'medium')}
              className={`w-full bg-white rounded-lg shadow p-2 transition-all ${activeCard === 'priority-medium' ? 'ring-2 ring-yellow-500 bg-yellow-50' : 'hover:shadow-md'
                }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Medium Priority</span>
                <span className="text-lg font-bold text-yellow-600">{stats.priorityStats.medium}</span>
              </div>
            </button>
            <button
              onClick={() => handleCardClick('priority-low', 'low')}
              className={`w-full bg-white rounded-lg shadow p-2 transition-all ${activeCard === 'priority-low' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:shadow-md'
                }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Low Priority</span>
                <span className="text-lg font-bold text-green-600">{stats.priorityStats.low}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ml-80">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Issue Management Dashboard</h1>
              <p className="text-gray-600 mt-1">View, filter, and manage all issues reported by citizens</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => localStorageService.exportAllData()}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                <Download className="w-3 h-3 mr-1.5" />
                Export JSON
              </button>
              <button
                onClick={() => localStorageService.exportToCSV()}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <Download className="w-3 h-3 mr-1.5" />
                Export CSV
              </button>
              <button
                onClick={() => localStorageService.exportToPDF()}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                <Download className="w-3 h-3 mr-1.5" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area - All Issues */}
        <div className="w-full">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                All Issues
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  {(() => {
                    const uniqueGroups = new Set(filteredIssues.map(i => i.id)).size;
                    const total = filteredIssues.length;
                    return total === uniqueGroups
                      ? `${total} of ${issues.length} issues`
                      : `${total} reports (${uniqueGroups} unique) of ${issues.length} total`;
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Show:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-600">per page</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
              {/* Search Input */}
              <div className="flex-1 min-w-64">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by description, location, ID, or type..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="pothole">Pothole</option>
                  <option value="garbage">Garbage Collection</option>
                  <option value="streetlight">Streetlight Failure</option>
                  <option value="water_leak">Water Leak</option>
                  <option value="broken_sidewalk">Broken Sidewalk</option>
                  <option value="traffic_signal">Traffic Signal Issue</option>
                  <option value="street_sign">Damaged/Missing Street Sign</option>
                  <option value="drainage">Drainage Problem</option>
                  <option value="tree_maintenance">Tree Maintenance</option>
                  <option value="graffiti">Graffiti/Vandalism</option>
                  <option value="noise_complaint">Noise Complaint</option>
                  <option value="parking_violation">Parking Violation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last Month</option>
                  <option value="year">Last Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location (Address)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIssues.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No issues found matching your filters
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      // Group issues by ID to show batch reporting
                      const groupedIssues = filteredIssues.reduce((acc, issue) => {
                        if (!acc[issue.id]) {
                          acc[issue.id] = [];
                        }
                        acc[issue.id].push(issue);
                        return acc;
                      }, {} as Record<string, Issue[]>);

                      // Flatten to array of groups
                      const issueGroups = Object.entries(groupedIssues);

                      // Calculate pagination
                      const totalGroups = issueGroups.length;
                      const totalPages = Math.ceil(totalGroups / itemsPerPage);
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedGroups = issueGroups.slice(startIndex, endIndex);

                      // Render paginated groups
                      return paginatedGroups.map(([issueId, issueGroup]) => {
                        const primaryIssue = issueGroup[0]; // Show the first report as primary
                        const reportCount = issueGroup.length;
                        const hasDuplicates = reportCount > 1;

                        return (
                          <tr
                            key={`${issueId}-${primaryIssue.created_at}`}
                            className={`hover:bg-gray-50 ${hasDuplicates ? 'bg-blue-50/30' : ''}`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <span>{primaryIssue.id.slice(0, 8)}</span>
                                {hasDuplicates && (
                                  <span
                                    className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-300"
                                    title={`${reportCount} citizens reported this issue`}
                                  >
                                    {reportCount}× Reports
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                  primaryIssue.status
                                )}`}
                              >
                                {getStatusLabel(primaryIssue.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                              {primaryIssue.issue_type.replace('_', ' ')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                                  primaryIssue.priority || 'medium'
                                )}`}
                              >
                                {getPriorityLabel(primaryIssue.priority || 'medium')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {primaryIssue.location_address || `${Number(primaryIssue.latitude).toFixed(4)}, ${Number(primaryIssue.longitude).toFixed(4)}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex flex-col">
                                <span>{new Date(primaryIssue.created_at).toLocaleDateString()}</span>
                                {hasDuplicates && (
                                  <span className="text-xs text-orange-600 font-medium">
                                    + {reportCount - 1} more
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => navigate(`/admin/issue/${primaryIssue.id}`)}
                                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium"
                              >
                                <Eye className="w-4 h-4" />
                                <span>View / Manage</span>
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredIssues.length > 0 && (() => {
              const groupedIssues = filteredIssues.reduce((acc, issue) => {
                if (!acc[issue.id]) acc[issue.id] = [];
                acc[issue.id].push(issue);
                return acc;
              }, {} as Record<string, Issue[]>);

              const totalGroups = Object.keys(groupedIssues).length;
              const totalPages = Math.ceil(totalGroups / itemsPerPage);

              if (totalPages <= 1) return null;

              return (
                <div className="flex items-center justify-between mt-6 px-4 py-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages} ({totalGroups} unique issues)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition ${currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition ${currentPage === totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
