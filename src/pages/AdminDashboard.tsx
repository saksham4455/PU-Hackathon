import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, Download, Eye, BarChart3 } from 'lucide-react';
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
    if (user && profile?.role === 'super_admin') {
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

  if (!user || profile?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Access Denied: Super Admin Only</p>
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
      <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-bl from-purple-600/10 to-blue-600/10 -skew-y-6 transform origin-top-right z-0 pointer-events-none"></div>

      {/* Fixed left column - Sidebar */}
      <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 bg-white/60 backdrop-blur-xl border-r border-white/20 z-10 overflow-y-auto custom-scrollbar shadow-lg">
        <div className="p-4 space-y-6">
          <div className="bg-blue-600/5 p-4 rounded-xl border border-blue-100">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3">Overview</h3>

            {/* Total Issues Card */}
            <button
              onClick={() => handleCardClick('all', null)}
              className={`w-full group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 ${activeCard === 'all'
                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg scale-[1.02]'
                : 'bg-white hover:bg-blue-50 text-gray-700 shadow-sm hover:shadow-md'
                }`}
            >
              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <span className={`text-sm font-medium ${activeCard === 'all' ? 'text-blue-100' : 'text-gray-500'}`}>Total Issues</span>
                  <div className={`text-3xl font-bold mt-1 ${activeCard === 'all' ? 'text-white' : 'text-gray-900'}`}>{stats.total}</div>
                </div>
                <div className={`p-2 rounded-lg ${activeCard === 'all' ? 'bg-white/20' : 'bg-blue-100'}`}>
                  <Eye className={`w-5 h-5 ${activeCard === 'all' ? 'text-white' : 'text-blue-600'}`} />
                </div>
              </div>
            </button>
          </div>

          {/* Status Stats */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Status Breakdown</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleCardClick('status-pending', 'pending')}
                className={`w-full relative overflow-hidden rounded-xl p-3 flex items-center justify-between transition-all ${activeCard === 'status-pending'
                  ? 'bg-red-500 text-white shadow-lg ring-2 ring-red-300 ring-offset-2'
                  : 'bg-white/80 hover:bg-red-50 text-gray-700 border border-red-100/50 shadow-sm'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${activeCard === 'status-pending' ? 'bg-white' : 'bg-red-500'}`}></div>
                  <span className="font-medium text-sm">Pending</span>
                </div>
                <span className={`font-bold ${activeCard === 'status-pending' ? 'text-white' : 'text-red-600'}`}>{stats.pending}</span>
              </button>

              <button
                onClick={() => handleCardClick('status-progress', 'in_progress')}
                className={`w-full relative overflow-hidden rounded-xl p-3 flex items-center justify-between transition-all ${activeCard === 'status-progress'
                  ? 'bg-yellow-500 text-white shadow-lg ring-2 ring-yellow-300 ring-offset-2'
                  : 'bg-white/80 hover:bg-yellow-50 text-gray-700 border border-yellow-100/50 shadow-sm'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${activeCard === 'status-progress' ? 'bg-white' : 'bg-yellow-500'}`}></div>
                  <span className="font-medium text-sm">In Progress</span>
                </div>
                <span className={`font-bold ${activeCard === 'status-progress' ? 'text-white' : 'text-yellow-600'}`}>{stats.inProgress}</span>
              </button>

              <button
                onClick={() => handleCardClick('status-resolved', 'resolved')}
                className={`w-full relative overflow-hidden rounded-xl p-3 flex items-center justify-between transition-all ${activeCard === 'status-resolved'
                  ? 'bg-green-500 text-white shadow-lg ring-2 ring-green-300 ring-offset-2'
                  : 'bg-white/80 hover:bg-green-50 text-gray-700 border border-green-100/50 shadow-sm'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${activeCard === 'status-resolved' ? 'bg-white' : 'bg-green-500'}`}></div>
                  <span className="font-medium text-sm">Resolved</span>
                </div>
                <span className={`font-bold ${activeCard === 'status-resolved' ? 'text-white' : 'text-green-600'}`}>{stats.resolved}</span>
              </button>
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Performance Team</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-gray-100 shadow-sm text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">{stats.resolutionRate}%</div>
                <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Resolution Rate</div>
              </div>
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-gray-100 shadow-sm text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">{stats.averageResolutionTime}d</div>
                <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Avg Time</div>
              </div>
            </div>

            <button
              onClick={() => handleCardClick('recent', 'week')}
              className={`w-full rounded-xl p-3 flex items-center justify-between transition-all ${activeCard === 'recent'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-100'
                }`}
            >
              <div className="flex flex-col items-start">
                <span className="text-xs font-bold uppercase opacity-80">This Week</span>
                <span className="text-sm font-medium">New Reports</span>
              </div>
              <span className="text-2xl font-bold">{stats.recentActivity}</span>
            </button>
          </div>

          {/* Priority Breakdown */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Priority Levels</h3>
            <div className="bg-white/60 backdrop-blur rounded-xl border border-gray-100 p-2 space-y-1">
              {(['critical', 'high', 'medium', 'low'] as const).map((priority) => (
                <button
                  key={priority}
                  onClick={() => handleCardClick(`priority-${priority}`, priority)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${activeCard === `priority-${priority}`
                    ? 'bg-gray-100 font-bold'
                    : 'hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${priority === 'critical' ? 'bg-red-600' :
                      priority === 'high' ? 'bg-orange-500' :
                        priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                    <span className="capitalize text-gray-700">{priority}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{stats.priorityStats[priority]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ml-80 relative z-10">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-end justify-between mb-2">
            <div>
              <h1 className="text-4xl font-heading font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xl text-gray-600 mt-1">Manage city issues and monitor resolution progress.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/admin/analytics')}
                className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-sm font-medium"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </button>
              <button
                onClick={() => navigate('/admin/action-panel')}
                className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-sm font-medium"
              >
                <Filter className="w-4 h-4 mr-2" />
                Open Action Panel
              </button>
              <button
                onClick={() => localStorageService.exportToCSV()}
              >
                <Download className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                CSV
              </button>
              <button
                onClick={() => localStorageService.exportToPDF()}
                className="group inline-flex items-center px-4 py-2 text-sm bg-white/50 backdrop-blur-md text-gray-700 border border-gray-200 rounded-xl hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all font-medium shadow-sm hover:shadow"
              >
                <Download className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area - All Issues */}
        <div className="w-full animate-slide-up">
          <div className="glass-panel rounded-2xl border border-white/60 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-100 bg-white/40">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-heading">
                    Issue Registry
                  </h2>
                  <div className="text-sm text-gray-500 mt-1 font-medium">
                    {(() => {
                      const uniqueGroups = new Set(filteredIssues.map(i => i.id)).size;
                      const total = filteredIssues.length;
                      return total === uniqueGroups
                        ? `${total} active reports found`
                        : `${total} reports across ${uniqueGroups} unique issues`;
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white/60 p-1.5 rounded-lg border border-gray-200/50 shadow-inner">
                  <span className="text-xs font-bold text-gray-500 uppercase px-2">Rows:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-sm font-semibold text-gray-900 border-none focus:ring-0 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                {/* Search Input */}
                <div className="col-span-1 md:col-span-2 relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search issues..."
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white/70 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all sm:text-sm shadow-sm"
                  />
                </div>

                <div className="lg:col-span-1">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-xl bg-white/70 shadow-sm transition-all"
                  >
                    <option value="all">Status: All</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div className="lg:col-span-1">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-xl bg-white/70 shadow-sm transition-all"
                  >
                    <option value="all">Type: All</option>
                    <option value="pothole">Pothole</option>
                    <option value="garbage">Garbage</option>
                    <option value="streetlight">Streetlight</option>
                    <option value="water_leak">Leak</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="lg:col-span-1">
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-xl bg-white/70 shadow-sm transition-all"
                  >
                    <option value="all">Priority: All</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="lg:col-span-1">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-xl bg-white/70 shadow-sm transition-all"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/60">
                <thead className="bg-gray-50/80 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID & Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location & Date</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white/40 divide-y divide-gray-100/60">
                  {filteredIssues.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Eye className="w-8 h-8 text-gray-300" />
                          </div>
                          <p className="text-lg font-medium text-gray-900">No issues found</p>
                          <p className="text-sm text-gray-500">Try adjusting your filters or search query.</p>
                        </div>
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

                      const issueGroups = Object.entries(groupedIssues);
                      const totalGroups = issueGroups.length;
                      const totalPages = Math.ceil(totalGroups / itemsPerPage);
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedGroups = issueGroups.slice(startIndex, endIndex);

                      return paginatedGroups.map(([issueId, issueGroup]) => {
                        const primaryIssue = issueGroup[0];
                        const reportCount = issueGroup.length;
                        const hasDuplicates = reportCount > 1;

                        return (
                          <tr
                            key={`${issueId}-${primaryIssue.created_at}`}
                            className={`hover:bg-blue-50/40 transition-colors duration-150 group ${hasDuplicates ? 'bg-blue-50/10' : ''}`}
                            onClick={() => navigate(`/admin/issue/${primaryIssue.id}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-medium text-gray-500">#{primaryIssue.id.slice(0, 8)}</span>
                                  {hasDuplicates && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-100 text-orange-700 uppercase tracking-wide">
                                      {reportCount} Reports
                                    </span>
                                  )}
                                </div>
                                <span className={`inline-flex items-center w-fit px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(primaryIssue.status)
                                  .replace('bg-', 'bg-opacity-10 bg-')
                                  .replace('text-', 'border-opacity-20 border-')
                                  }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${primaryIssue.status === 'resolved' ? 'bg-green-500' :
                                    primaryIssue.status === 'in_progress' ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}></span>
                                  {getStatusLabel(primaryIssue.status)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-gray-900 capitalize flex items-center gap-2">
                                {primaryIssue.issue_type.replace('_', ' ')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase ${getPriorityColor(primaryIssue.priority || 'medium')
                                .replace('bg-', 'bg-opacity-20 bg-')
                                .replace('text-', 'text-opacity-90 ')
                                }`}>
                                {getPriorityLabel(primaryIssue.priority || 'medium')}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <div className="flex items-center text-sm text-gray-900 font-medium mb-0.5">
                                  <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                  </svg>
                                  <span className="truncate max-w-xs">{primaryIssue.location_address || `${Number(primaryIssue.latitude).toFixed(4)}, ${Number(primaryIssue.longitude).toFixed(4)}`}</span>
                                </div>
                                <span className="text-xs text-gray-500 ml-5">
                                  {new Date(primaryIssue.created_at).toLocaleDateString()} at {new Date(primaryIssue.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <button
                                className="group inline-flex items-center justify-center text-blue-600 bg-white border border-blue-100 hover:bg-blue-50 hover:border-blue-200 shadow-sm hover:shadow-md px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-xs"
                              >
                                View Details
                                <ChevronRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform duration-200" />
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

              if (totalPages <= 1) return <div className="h-4"></div>;

              return (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                  <div className="text-sm text-gray-500 font-medium">
                    Showing page <span className="text-gray-900 font-bold">{currentPage}</span> of <span className="text-gray-900 font-bold">{totalPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${currentPage === 1
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm'
                        }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page Numbers */}
                    <div className="hidden sm:flex items-center gap-1">
                      {(() => {
                        const pages = [];
                        let startPage = Math.max(1, currentPage - 2);
                        let endPage = Math.min(totalPages, startPage + 4);

                        // Adjust if we are near the end
                        if (endPage - startPage < 4) {
                          startPage = Math.max(1, endPage - 4);
                        }

                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => setCurrentPage(i)}
                              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${currentPage === i
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-transparent text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                              {i}
                            </button>
                          );
                        }
                        return pages;
                      })()}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${currentPage === totalPages
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm'
                        }`}
                    >
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
