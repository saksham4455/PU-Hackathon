import { useEffect, useState } from 'react';

import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  MapPin, 
  Download, 
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { localStorageService, Issue } from '../lib/localStorage';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);


interface IssueStats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  avgResolutionTime: number;
  resolutionRate: number;
}

interface DepartmentStats {
  name: string;
  issuesAssigned: number;
  avgResolutionTime: number;
  resolutionRate: number;
  cost: number;
  efficiencyScore: number;
  costPerResolution: number;
  trendScore: number;
  priorityBreakdown: Record<string, number>;
  monthlyTrend: number[];
}

interface MonthlyReport {
  month: string;
  totalIssues: number;
  resolvedIssues: number;
  avgResolutionTime: number;
  totalCost: number;
  departmentBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  efficiencyScore: number;
  costPerIssue: number;
  trendIndicator: 'up' | 'down' | 'stable';
}

interface GeographicData {
  latitude: number;
  longitude: number;
  issueCount: number;
  issueType: string;
  priority: string;
}

export function AnalyticsPage() {
  const { user, profile } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedReportType, setSelectedReportType] = useState<string>('monthly');
  const [stats, setStats] = useState<IssueStats | null>(null);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [geographicData, setGeographicData] = useState<GeographicData[]>([]);

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      loadAnalyticsData();
    }
  }, [user, profile, selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      console.log('Loading analytics data...');
      const { issues: allIssues, error } = await localStorageService.getIssues();
      if (error) {
        console.error('Error loading issues:', error);
        return;
      }
      
      console.log('Loaded issues:', allIssues);
      
      // Filter by selected period
      const filteredIssues = filterIssuesByPeriod(allIssues, selectedPeriod);
      console.log('Filtered issues:', filteredIssues);
      setIssues(filteredIssues);
      
      // Calculate statistics
      const calculatedStats = calculateIssueStats(filteredIssues);
      setStats(calculatedStats);
      
      // Calculate department performance
      const deptStats = calculateDepartmentStats(filteredIssues);
      setDepartmentStats(deptStats);
      
      // Generate monthly reports
      const monthlyData = generateMonthlyReports(filteredIssues);
      setMonthlyReports(monthlyData);
      
      // Prepare geographic data
      const geoData = prepareGeographicData(filteredIssues);
      setGeographicData(geoData);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterIssuesByPeriod = (issues: Issue[], period: string): Issue[] => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (period) {
      case '7':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case '365':
        cutoffDate.setDate(now.getDate() - 365);
        break;
      case 'all':
        return issues; // Return all issues without date filtering
      default:
        return issues;
    }
    
    return issues.filter(issue => new Date(issue.created_at) >= cutoffDate);
  };

  const calculateIssueStats = (issues: Issue[]): IssueStats => {
    const total = issues.length;
    const pending = issues.filter(i => i.status === 'pending').length;
    const in_progress = issues.filter(i => i.status === 'in_progress').length;
    const resolved = issues.filter(i => i.status === 'resolved').length;
    
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    
    issues.forEach(issue => {
      byType[issue.issue_type] = (byType[issue.issue_type] || 0) + 1;
      byPriority[issue.priority || 'medium'] = (byPriority[issue.priority || 'medium'] || 0) + 1;
    });
    
    // Calculate average resolution time
    const resolvedIssues = issues.filter(i => i.status === 'resolved');
    const totalResolutionTime = resolvedIssues.reduce((sum, issue) => {
      const created = new Date(issue.created_at);
      const updated = new Date(issue.updated_at);
      return sum + (updated.getTime() - created.getTime());
    }, 0);
    
    const avgResolutionTime = resolvedIssues.length > 0 
      ? totalResolutionTime / resolvedIssues.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;
    
    const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;
    
    return {
      total,
      pending,
      in_progress,
      resolved,
      byType,
      byPriority,
      avgResolutionTime,
      resolutionRate
    };
  };

  const calculateDepartmentStats = (issues: Issue[]): DepartmentStats[] => {
    // Mock department data - in a real app, this would come from your backend
    const departments = [
      { name: 'Road Maintenance', costPerIssue: 150 },
      { name: 'Sanitation', costPerIssue: 75 },
      { name: 'Utilities', costPerIssue: 200 },
      { name: 'Public Safety', costPerIssue: 100 },
      { name: 'Parks & Recreation', costPerIssue: 125 }
    ];
    
    return departments.map(dept => {
      const deptIssues = issues.filter(issue => 
        getDepartmentForIssueType(issue.issue_type) === dept.name
      );
      
      const resolvedIssues = deptIssues.filter(i => i.status === 'resolved');
      const totalResolutionTime = resolvedIssues.reduce((sum, issue) => {
        const created = new Date(issue.created_at);
        const updated = new Date(issue.updated_at);
        return sum + (updated.getTime() - created.getTime());
      }, 0);
      
      const avgResolutionTime = resolvedIssues.length > 0 
        ? totalResolutionTime / resolvedIssues.length / (1000 * 60 * 60 * 24)
        : 0;
      
      const resolutionRate = deptIssues.length > 0 
        ? (resolvedIssues.length / deptIssues.length) * 100 
        : 0;
      
      // Calculate efficiency score (0-100)
      const efficiencyScore = Math.min(100, Math.max(0, 
        (resolutionRate * 0.4) + 
        ((Math.max(0, 30 - avgResolutionTime) / 30) * 100 * 0.3) + 
        ((Math.max(0, 100 - (deptIssues.length * 2)) / 100) * 100 * 0.3)
      ));
      
      const costPerResolution = resolvedIssues.length > 0 
        ? (deptIssues.length * dept.costPerIssue) / resolvedIssues.length 
        : 0;
      
      // Calculate trend score based on recent performance
      const recentIssues = deptIssues.filter(issue => {
        const issueDate = new Date(issue.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return issueDate >= thirtyDaysAgo;
      });
      
      const recentResolutionRate = recentIssues.length > 0 
        ? (recentIssues.filter(i => i.status === 'resolved').length / recentIssues.length) * 100 
        : 0;
      
      const trendScore = recentResolutionRate - resolutionRate;
      
      // Priority breakdown
      const priorityBreakdown = deptIssues.reduce((acc, issue) => {
        const priority = issue.priority || 'medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Monthly trend (last 6 months)
      const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - (5 - i));
        monthStart.setDate(1);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        
        return deptIssues.filter(issue => {
          const issueDate = new Date(issue.created_at);
          return issueDate >= monthStart && issueDate < monthEnd;
        }).length;
      });
      
      return {
        name: dept.name,
        issuesAssigned: deptIssues.length,
        avgResolutionTime,
        resolutionRate,
        cost: deptIssues.length * dept.costPerIssue,
        efficiencyScore,
        costPerResolution,
        trendScore,
        priorityBreakdown,
        monthlyTrend
      };
    });
  };

  const getDepartmentForIssueType = (issueType: string): string => {
    const mapping: Record<string, string> = {
      'pothole': 'Road Maintenance',
      'garbage': 'Sanitation',
      'streetlight': 'Utilities',
      'water_leak': 'Utilities',
      'broken_sidewalk': 'Road Maintenance',
      'traffic_signal': 'Public Safety',
      'street_sign': 'Public Safety',
      'drainage': 'Utilities',
      'tree_maintenance': 'Parks & Recreation',
      'graffiti': 'Public Safety',
      'noise_complaint': 'Public Safety',
      'parking_violation': 'Public Safety',
      'other': 'General Services'
    };
    return mapping[issueType] || 'General Services';
  };

  const generateMonthlyReports = (issues: Issue[]): MonthlyReport[] => {
    const monthlyData: Record<string, MonthlyReport> = {};
    
    issues.forEach(issue => {
      const month = new Date(issue.created_at).toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          totalIssues: 0,
          resolvedIssues: 0,
          avgResolutionTime: 0,
          totalCost: 0,
          departmentBreakdown: {},
          priorityBreakdown: {},
          efficiencyScore: 0,
          costPerIssue: 0,
          trendIndicator: 'stable'
        };
      }
      
      monthlyData[month].totalIssues++;
      if (issue.status === 'resolved') {
        monthlyData[month].resolvedIssues++;
      }
      
      // Add cost based on issue type
      const cost = getCostForIssueType(issue.issue_type);
      monthlyData[month].totalCost += cost;
      
      // Department breakdown
      const department = getDepartmentForIssueType(issue.issue_type);
      monthlyData[month].departmentBreakdown[department] = 
        (monthlyData[month].departmentBreakdown[department] || 0) + 1;
      
      // Priority breakdown
      const priority = issue.priority || 'medium';
      monthlyData[month].priorityBreakdown[priority] = 
        (monthlyData[month].priorityBreakdown[priority] || 0) + 1;
    });
    
    // Calculate additional metrics for each month
    Object.keys(monthlyData).forEach(month => {
      const monthIssues = issues.filter(issue => 
        issue.created_at.startsWith(month) && issue.status === 'resolved'
      );
      
      if (monthIssues.length > 0) {
        const totalTime = monthIssues.reduce((sum, issue) => {
          const created = new Date(issue.created_at);
          const updated = new Date(issue.updated_at);
          return sum + (updated.getTime() - created.getTime());
        }, 0);
        
        monthlyData[month].avgResolutionTime = totalTime / monthIssues.length / (1000 * 60 * 60 * 24);
      }
      
      // Calculate efficiency score
      const resolutionRate = monthlyData[month].totalIssues > 0 
        ? (monthlyData[month].resolvedIssues / monthlyData[month].totalIssues) * 100 
        : 0;
      
      const avgResolutionTime = monthlyData[month].avgResolutionTime;
      monthlyData[month].efficiencyScore = Math.min(100, Math.max(0, 
        (resolutionRate * 0.5) + 
        ((Math.max(0, 30 - avgResolutionTime) / 30) * 100 * 0.5)
      ));
      
      // Calculate cost per issue
      monthlyData[month].costPerIssue = monthlyData[month].totalIssues > 0 
        ? monthlyData[month].totalCost / monthlyData[month].totalIssues 
        : 0;
    });
    
    // Calculate trend indicators
    const sortedMonths = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    sortedMonths.forEach((report, index) => {
      if (index > 0) {
        const prevReport = sortedMonths[index - 1];
        const efficiencyDiff = report.efficiencyScore - prevReport.efficiencyScore;
        
        if (efficiencyDiff > 5) {
          report.trendIndicator = 'up';
        } else if (efficiencyDiff < -5) {
          report.trendIndicator = 'down';
        } else {
          report.trendIndicator = 'stable';
        }
      }
    });
    
    return sortedMonths;
  };

  const getCostForIssueType = (issueType: string): number => {
    const costMapping: Record<string, number> = {
      'pothole': 150,
      'garbage': 75,
      'streetlight': 200,
      'water_leak': 300,
      'broken_sidewalk': 100,
      'traffic_signal': 150,
      'street_sign': 100,
      'drainage': 250,
      'tree_maintenance': 125,
      'graffiti': 50,
      'noise_complaint': 25,
      'parking_violation': 25,
      'other': 100
    };
    return costMapping[issueType] || 100;
  };

  const prepareGeographicData = (issues: Issue[]): GeographicData[] => {
    return issues.map(issue => ({
      latitude: issue.latitude,
      longitude: issue.longitude,
      issueCount: 1,
      issueType: issue.issue_type,
      priority: issue.priority || 'medium'
    }));
  };

  const generateLineChartData = (issues: Issue[]) => {
    console.log('Generating line chart data for issues:', issues);
    // Group issues by date
    const dateGroups: Record<string, number> = {};
    issues.forEach(issue => {
      const date = new Date(issue.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      dateGroups[date] = (dateGroups[date] || 0) + 1;
    });

    const sortedDates = Object.keys(dateGroups).sort((a, b) => {
      const dateA = new Date(a + ', ' + new Date().getFullYear());
      const dateB = new Date(b + ', ' + new Date().getFullYear());
      return dateA.getTime() - dateB.getTime();
    });

    const chartData = {
      labels: sortedDates,
      datasets: [
        {
          label: 'Issues Created',
          data: sortedDates.map(date => dateGroups[date]),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
      ],
    };
    
    console.log('Generated line chart data:', chartData);
    return chartData;
  };

  const generatePieChartData = (data: Record<string, number>, colors: string[]) => {
    console.log('Generating pie chart data:', data, colors);
    const labels = Object.keys(data);
    const values = Object.values(data);
    
    const chartData = {
      labels: labels.map(label => label.charAt(0).toUpperCase() + label.slice(1)),
      datasets: [
        {
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: colors.slice(0, labels.length).map(color => color.replace('0.6', '1')),
          borderWidth: 2,
        },
      ],
    };
    
    console.log('Generated pie chart data:', chartData);
    return chartData;
  };

  const exportReport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const csvData = monthlyReports.map(report => ({
        Month: report.month,
        'Total Issues': report.totalIssues,
        'Resolved Issues': report.resolvedIssues,
        'Resolution Rate (%)': report.totalIssues > 0 ? ((report.resolvedIssues / report.totalIssues) * 100).toFixed(1) : 0,
        'Avg Resolution Time (days)': report.avgResolutionTime.toFixed(2),
        'Efficiency Score (%)': report.efficiencyScore.toFixed(1),
        'Cost per Issue (₹)': report.costPerIssue.toFixed(2),
        'Total Cost (₹)': report.totalCost,
        'Trend': report.trendIndicator,
        'Department Breakdown': JSON.stringify(report.departmentBreakdown),
        'Priority Breakdown': JSON.stringify(report.priorityBreakdown)
      }));
      
      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // Generate PDF report using browser's print functionality
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const currentDate = new Date().toLocaleDateString();
        const totalIssues = stats?.total || 0;

        const avgResolutionTime = stats?.avgResolutionTime || 0;
        const resolutionRate = stats?.resolutionRate || 0;
        
        const pdfContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Analytics Report - ${currentDate}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 25px; }
              .section h2 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
              .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
              .metric-card { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; }
              .metric-value { font-size: 24px; font-weight: bold; color: #1f2937; }
              .metric-label { color: #6b7280; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
              th { background-color: #f9fafb; font-weight: 600; }
              .department-card { background: #f9fafb; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
              .efficiency-badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
              .efficiency-high { background: #dcfce7; color: #166534; }
              .efficiency-medium { background: #fef3c7; color: #92400e; }
              .efficiency-low { background: #fee2e2; color: #991b1b; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>City Issue Management Analytics Report</h1>
              <p>Generated on ${currentDate}</p>
            </div>
            
            <div class="section">
              <h2>Executive Summary</h2>
              <div class="metrics-grid">
                <div class="metric-card">
                  <div class="metric-value">${totalIssues}</div>
                  <div class="metric-label">Total Issues</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${resolutionRate.toFixed(1)}%</div>
                  <div class="metric-label">Resolution Rate</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${avgResolutionTime.toFixed(1)} days</div>
                  <div class="metric-label">Avg Resolution Time</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">₹{monthlyReports.reduce((sum, report) => sum + report.totalCost, 0).toLocaleString()}</div>
                  <div class="metric-label">Total Cost</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2>Department Performance</h2>
              ${departmentStats.map(dept => `
                <div class="department-card">
                  <h3>${dept.name}</h3>
                  <p><strong>Issues Assigned:</strong> ${dept.issuesAssigned}</p>
                  <p><strong>Resolution Rate:</strong> ${dept.resolutionRate.toFixed(1)}%</p>
                  <p><strong>Avg Resolution Time:</strong> ${dept.avgResolutionTime.toFixed(1)} days</p>
                  <p><strong>Efficiency Score:</strong> 
                    <span class="efficiency-badge ${dept.efficiencyScore >= 80 ? 'efficiency-high' : dept.efficiencyScore >= 60 ? 'efficiency-medium' : 'efficiency-low'}">
                      ${dept.efficiencyScore.toFixed(0)}%
                    </span>
                  </p>
                  <p><strong>Total Cost:</strong> ₹{dept.cost.toLocaleString()}</p>
                </div>
              `).join('')}
            </div>
            
            <div class="section">
              <h2>Monthly Reports</h2>
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Total Issues</th>
                    <th>Resolved</th>
                    <th>Resolution Rate</th>
                    <th>Efficiency Score</th>
                    <th>Total Cost</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  ${monthlyReports.map(report => `
                    <tr>
                      <td>${new Date(report.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</td>
                      <td>${report.totalIssues}</td>
                      <td>${report.resolvedIssues}</td>
                      <td>${report.totalIssues > 0 ? ((report.resolvedIssues / report.totalIssues) * 100).toFixed(1) : 0}%</td>
                      <td>${report.efficiencyScore.toFixed(0)}%</td>
                      <td>₹{report.totalCost.toLocaleString()}</td>
                      <td>${report.trendIndicator === 'up' ? '↗ Improving' : report.trendIndicator === 'down' ? '↘ Declining' : '→ Stable'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </body>
          </html>
        `;
        
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-600">Access denied. Admin privileges required.</div>
      </div>
    );
  }

  console.log('Rendering Analytics page with stats:', stats, 'issues:', issues);

  return (
    <div className="min-h-screen bg-gray-50 flex-grow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <span>Analytics & Reporting</span>
              </h1>
              <p className="mt-2 text-gray-600">
                Comprehensive insights into city issue management performance
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
                <option value="all">All time</option>
              </select>
              
              <button
                onClick={() => exportReport('csv')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              
              <button
                onClick={() => exportReport('pdf')}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Issues</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolutionRate.toFixed(1)}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Resolution Time</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.avgResolutionTime.toFixed(1)} days</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Issues</p>
                  <p className="text-2xl font-bold text-red-600">{stats.pending}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>
        )}

         {/* Charts Section */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
           {/* Issue Trends Line Chart */}
           <div className="bg-white p-6 rounded-lg shadow-sm border">
             <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
               <TrendingUp className="w-5 h-5 text-blue-600" />
               <span>Issue Trends Over Time</span>
             </h3>
             
             <div className="h-64">
               {issues.length > 0 ? (
                 <Line 
                   data={generateLineChartData(issues)} 
                   options={{
                     responsive: true,
                     maintainAspectRatio: false,
                     plugins: {
                       legend: {
                         display: false,
                       },
                     },
                     scales: {
                       y: {
                         beginAtZero: true,
                         ticks: {
                           stepSize: 1,
                         },
                       },
                     },
                   }}
                 />
               ) : (
                 <div className="flex items-center justify-center h-full text-gray-500">
                   No data available
                 </div>
               )}
             </div>
           </div>

           {/* Issues by Type Pie Chart */}
           <div className="bg-white p-6 rounded-lg shadow-sm border">
             <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
               <BarChart3 className="w-5 h-5 text-green-600" />
               <span>Issues by Type</span>
             </h3>
             
             <div className="h-64">
               {stats && Object.keys(stats.byType).length > 0 ? (
                 <Pie 
                   data={generatePieChartData(stats.byType, [
                     'rgba(59, 130, 246, 0.6)',
                     'rgba(16, 185, 129, 0.6)',
                     'rgba(245, 158, 11, 0.6)',
                     'rgba(239, 68, 68, 0.6)',
                     'rgba(139, 92, 246, 0.6)',
                     'rgba(236, 72, 153, 0.6)',
                     'rgba(14, 165, 233, 0.6)',
                     'rgba(34, 197, 94, 0.6)',
                   ])} 
                   options={{
                     responsive: true,
                     maintainAspectRatio: false,
                     plugins: {
                       legend: {
                         position: 'bottom' as const,
                         labels: {
                           padding: 20,
                           usePointStyle: true,
                         },
                       },
                     },
                   }}
                 />
               ) : (
                 <div className="flex items-center justify-center h-full text-gray-500">
                   No data available
                 </div>
               )}
             </div>
           </div>

           {/* Issues by Priority Pie Chart */}
           <div className="bg-white p-6 rounded-lg shadow-sm border">
             <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
               <AlertTriangle className="w-5 h-5 text-red-600" />
               <span>Issues by Priority</span>
             </h3>
             
             <div className="h-64">
               {stats && Object.keys(stats.byPriority).length > 0 ? (
                 <Pie 
                   data={generatePieChartData(stats.byPriority, [
                     'rgba(239, 68, 68, 0.6)',   // Critical - Red
                     'rgba(245, 158, 11, 0.6)',  // High - Orange
                     'rgba(59, 130, 246, 0.6)',  // Medium - Blue
                     'rgba(34, 197, 94, 0.6)',   // Low - Green
                   ])} 
                   options={{
                     responsive: true,
                     maintainAspectRatio: false,
                     plugins: {
                       legend: {
                         position: 'bottom' as const,
                         labels: {
                           padding: 20,
                           usePointStyle: true,
                         },
                       },
                     },
                   }}
                 />
               ) : (
                 <div className="flex items-center justify-center h-full text-gray-500">
                   No data available
                 </div>
               )}
             </div>
           </div>
         </div>

         {/* Department Performance Charts */}
         <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Department Performance Trends</span>
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Efficiency Comparison */}
              <div className="h-64">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Efficiency Score Comparison</h4>
                {departmentStats.length > 0 ? (
                  <div className="space-y-3">
                    {departmentStats.map((dept, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-24 text-sm text-gray-600 truncate">{dept.name}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                          <div 
                            className={`h-4 rounded-full transition-all duration-500 ${
                              dept.efficiencyScore >= 80 ? 'bg-green-500' :
                              dept.efficiencyScore >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${dept.efficiencyScore}%` }}
                          ></div>
                        </div>
                        <div className="w-12 text-sm font-medium text-gray-900">
                          {dept.efficiencyScore.toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available
                  </div>
                )}
              </div>
              
              {/* Department Cost Analysis */}
              <div className="h-64">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Cost per Resolution</h4>
                {departmentStats.length > 0 ? (
                  <div className="space-y-3">
                    {departmentStats.map((dept, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-24 text-sm text-gray-600 truncate">{dept.name}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                          <div 
                            className="h-4 bg-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (dept.costPerResolution / 500) * 100)}%` }}
                          ></div>
                        </div>
                        <div className="w-16 text-sm font-medium text-gray-900">
                          ₹{dept.costPerResolution.toFixed(0)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </div>

         {/* Department Performance */}
         <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <span>Department Performance</span>
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {departmentStats.map((dept, index) => (
                <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 text-lg">{dept.name}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dept.efficiencyScore >= 80 ? 'bg-green-100 text-green-800' :
                        dept.efficiencyScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {dept.efficiencyScore.toFixed(0)}% Efficiency
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dept.trendScore > 0 ? 'bg-green-100 text-green-800' :
                        dept.trendScore < 0 ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {dept.trendScore > 0 ? '↗' : dept.trendScore < 0 ? '↘' : '→'} Trend
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Issues Assigned</div>
                      <div className="text-xl font-bold text-blue-600">{dept.issuesAssigned}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Resolution Rate</div>
                      <div className="text-xl font-bold text-green-600">{dept.resolutionRate.toFixed(1)}%</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Avg Resolution Time</div>
                      <div className="text-xl font-bold text-orange-600">{dept.avgResolutionTime.toFixed(1)} days</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Cost per Resolution</div>
                      <div className="text-xl font-bold text-purple-600">₹{dept.costPerResolution.toFixed(0)}</div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Priority Breakdown</span>
                    </div>
                    <div className="flex space-x-2">
                      {Object.entries(dept.priorityBreakdown).map(([priority, count]) => (
                        <div key={priority} className="flex-1 text-center">
                          <div className={`text-xs px-2 py-1 rounded ${
                            priority === 'critical' ? 'bg-red-100 text-red-800' :
                            priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                          </div>
                          <div className="text-sm font-medium mt-1">{count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="font-semibold text-gray-900">₹{dept.cost.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        {/* Geographic Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-red-600" />
            <span>Geographic Analysis</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Issue Density</h4>
              <div className="text-2xl font-bold text-gray-900">{geographicData.length}</div>
              <p className="text-sm text-gray-600">Total locations with issues</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Hotspots</h4>
              <div className="text-2xl font-bold text-red-600">
                {geographicData.filter(d => d.priority === 'critical' || d.priority === 'high').length}
              </div>
              <p className="text-sm text-gray-600">High priority locations</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Coverage</h4>
              <div className="text-2xl font-bold text-blue-600">
                {new Set(geographicData.map(d => `${d.latitude.toFixed(2)},${d.longitude.toFixed(2)}`)).size}
              </div>
              <p className="text-sm text-gray-600">Unique locations</p>
            </div>
          </div>
        </div>

        {/* Monthly Reports */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span>Monthly Reports</span>
            </h3>
            
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Issues
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resolved
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resolution Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Resolution Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Efficiency Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost per Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyReports.map((report, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(report.month + '-01').toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.totalIssues}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.resolvedIssues}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (report.resolvedIssues / report.totalIssues * 100) >= 80 ? 'bg-green-100 text-green-800' :
                        (report.resolvedIssues / report.totalIssues * 100) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {report.totalIssues > 0 ? ((report.resolvedIssues / report.totalIssues) * 100).toFixed(1) : 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.avgResolutionTime.toFixed(1)} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.efficiencyScore >= 80 ? 'bg-green-100 text-green-800' :
                        report.efficiencyScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {report.efficiencyScore.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{report.costPerIssue.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{report.totalCost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.trendIndicator === 'up' ? 'bg-green-100 text-green-800' :
                        report.trendIndicator === 'down' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {report.trendIndicator === 'up' ? '↗ Improving' :
                         report.trendIndicator === 'down' ? '↘ Declining' :
                         '→ Stable'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Summary Cards */}
          {monthlyReports.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Best Performing Month</div>
                <div className="text-lg font-bold text-blue-900">
                  {monthlyReports.reduce((best, current) => 
                    current.efficiencyScore > best.efficiencyScore ? current : best
                  ).month}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Average Resolution Rate</div>
                <div className="text-lg font-bold text-green-900">
                  {(monthlyReports.reduce((sum, report) => 
                    sum + (report.resolvedIssues / report.totalIssues * 100), 0) / monthlyReports.length).toFixed(1)}%
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Total Cost</div>
                <div className="text-lg font-bold text-purple-900">
                  ₹{monthlyReports.reduce((sum, report) => sum + report.totalCost, 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-orange-600 font-medium">Avg Resolution Time</div>
                <div className="text-lg font-bold text-orange-900">
                  {(monthlyReports.reduce((sum, report) => sum + report.avgResolutionTime, 0) / monthlyReports.length).toFixed(1)} days
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
