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
  Activity,
  Lightbulb,
  Medal
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

interface TimeStats {
  '< 24h': number;
  '1-3 days': number;
  '3-7 days': number;
  '> 7 days': number;
}

interface ReporterStats {
  name: string;
  count: number;
}

interface Insight {
  type: 'critical' | 'warning' | 'info' | 'positive';
  title: string;
  message: string;
}

export function AnalyticsPage() {
  const { user, profile } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [stats, setStats] = useState<IssueStats | null>(null);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [geographicData, setGeographicData] = useState<GeographicData[]>([]);
  const [timeStats, setTimeStats] = useState<TimeStats>({ '< 24h': 0, '1-3 days': 0, '3-7 days': 0, '> 7 days': 0 });
  const [reporterStats, setReporterStats] = useState<ReporterStats[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    if (user && profile?.role === 'super_admin') {
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

      // Calculate time distribution stats
      const timeStatsData = calculateTimeStats(filteredIssues);
      setTimeStats(timeStatsData);

      // Calculate top reporters
      const reportersData = calculateReporterStats(filteredIssues);
      setReporterStats(reportersData);

      // Generate AI insights
      const insightsData = generateInsights(monthlyData, deptStats);
      setInsights(insightsData);

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

  const calculateTimeStats = (issues: Issue[]): TimeStats => {
    const resolved = issues.filter(i => i.status === 'resolved');
    const distribution: TimeStats = {
      '< 24h': 0,
      '1-3 days': 0,
      '3-7 days': 0,
      '> 7 days': 0
    };

    resolved.forEach(issue => {
      const created = new Date(issue.created_at);
      const updated = new Date(issue.updated_at);
      const hours = (updated.getTime() - created.getTime()) / (1000 * 60 * 60);

      if (hours < 24) distribution['< 24h']++;
      else if (hours < 72) distribution['1-3 days']++;
      else if (hours < 168) distribution['3-7 days']++;
      else distribution['> 7 days']++;
    });

    return distribution;
  };

  const calculateReporterStats = (issues: Issue[]): ReporterStats[] => {
    const reporters: Record<string, number> = {};
    issues.forEach(issue => {
      // Mock reporter names based on user_id if actual names aren't available
      const reporter = `Citizen ${issue.user_id ? issue.user_id.substring(0, 4) : 'Anon'}`;
      reporters[reporter] = (reporters[reporter] || 0) + 1;
    });

    return Object.entries(reporters)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  };

  const generateInsights = (monthly: MonthlyReport[], depts: DepartmentStats[]): Insight[] => {
    const insights: Insight[] = [];

    // Trend Insight
    if (monthly.length >= 2) {
      const current = monthly[monthly.length - 1];
      const previous = monthly[monthly.length - 2];
      const percentChange = previous.totalIssues > 0
        ? ((current.totalIssues - previous.totalIssues) / previous.totalIssues * 100).toFixed(1)
        : '0';

      if (Number(percentChange) > 10) {
        insights.push({
          type: 'warning',
          title: 'Surge in Reports',
          message: `Issue reporting has increased by ${percentChange}% compared to last month. Consider allocating extra resources.`
        });
      } else if (Number(percentChange) < -10) {
        insights.push({
          type: 'positive',
          title: 'Reduced Volume',
          message: `Issue reporting dropped by ${Math.abs(Number(percentChange))}% this month, indicating improved city conditions.`
        });
      }
    }

    // Efficiency Insight
    const lowEfficiencyDept = [...depts].sort((a, b) => a.efficiencyScore - b.efficiencyScore)[0];
    if (lowEfficiencyDept && lowEfficiencyDept.efficiencyScore < 60) {
      insights.push({
        type: 'critical',
        title: 'Department Attention Needed',
        message: `${lowEfficiencyDept.name} is operating at ${lowEfficiencyDept.efficiencyScore.toFixed(0)}% efficiency. Review workflow bottlenecks.`
      });
    }

    // Cost Insight
    const highCostDept = [...depts].sort((a, b) => b.costPerResolution - a.costPerResolution)[0];
    if (highCostDept && highCostDept.costPerResolution > 0) {
      insights.push({
        type: 'info',
        title: 'Cost Optimization',
        message: `${highCostDept.name} has the highest cost per resolution (₹${highCostDept.costPerResolution.toFixed(0)}). Investigate preventative maintenance opportunities.`
      });
    }

    // Fallback if no specific insights
    if (insights.length === 0) {
      insights.push({
        type: 'positive',
        title: 'Steady Performance',
        message: 'City operations are performing within expected parameters. No critical anomalies detected.'
      });
    }

    return insights;
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

  if (!user || profile?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-600">Access denied. Super Admin privileges required.</div>
      </div>
    );
  }

  console.log('Rendering Analytics page with stats:', stats, 'issues:', issues);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex-grow py-8 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-200/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-200/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 tracking-tight">
                <div className="p-3 bg-white/50 rounded-xl shadow-sm backdrop-blur-md">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <span>Analytics & Reporting</span>
              </h1>
              <p className="mt-2 text-lg text-gray-600 ml-1">
                Comprehensive insights into city issue management performance
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2.5 bg-white/60 border border-white/60 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm backdrop-blur-md transition-all hover:bg-white/80 font-medium"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
                <option value="all">All time</option>
              </select>

              <button
                onClick={() => exportReport('csv')}
                className="flex items-center space-x-2 px-4 py-2.5 bg-white/60 text-gray-700 border border-white/60 rounded-xl hover:bg-green-50 hover:text-green-700 hover:border-green-200 shadow-sm transition-all transform hover:-translate-y-0.5 font-medium"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>

              <button
                onClick={() => exportReport('pdf')}
                className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 font-medium"
              >
                <Download className="w-4 h-4" />
                <span>PDF Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="glass-panel p-6 flex items-center justify-between group hover:scale-[1.02] transition-transform duration-300">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Issues</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.total}</p>
                <p className="text-xs text-gray-400 mt-1">Recorded in period</p>
              </div>
              <div className="p-3 bg-blue-100/50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <Activity className="w-8 h-8" />
              </div>
            </div>

            <div className="glass-panel p-6 flex items-center justify-between group hover:scale-[1.02] transition-transform duration-300">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Resolution Rate</p>
                <p className="text-3xl font-extrabold text-green-600 mt-1">{stats.resolutionRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-400 mt-1">Target: 85%</p>
              </div>
              <div className="p-3 bg-green-100/50 text-green-600 rounded-2xl group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>

            <div className="glass-panel p-6 flex items-center justify-between group hover:scale-[1.02] transition-transform duration-300">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Avg Time</p>
                <p className="text-3xl font-extrabold text-orange-600 mt-1">{stats.avgResolutionTime.toFixed(1)} <span className="text-lg font-medium text-gray-500">days</span></p>
                <p className="text-xs text-gray-400 mt-1">To resolve issue</p>
              </div>
              <div className="p-3 bg-orange-100/50 text-orange-600 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                <Clock className="w-8 h-8" />
              </div>
            </div>

            <div className="glass-panel p-6 flex items-center justify-between group hover:scale-[1.02] transition-transform duration-300">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pending</p>
                <p className="text-3xl font-extrabold text-red-600 mt-1">{stats.pending}</p>
                <p className="text-xs text-gray-400 mt-1">Action required</p>
              </div>
              <div className="p-3 bg-red-100/50 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                <AlertTriangle className="w-8 h-8" />
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {/* Issue Trends Line Chart */}
          <div className="lg:col-span-2 glass-panel p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <TrendingUp className="w-32 h-32 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Issue Trends Over Time
            </h3>

            <div className="h-80 w-full">
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
                      tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#1f2937',
                        bodyColor: '#4b5563',
                        borderColor: '#e5e7eb',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        cornerRadius: 8,
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)',
                        },
                        ticks: {
                          font: {
                            family: "'Inter', sans-serif",
                          }
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          font: {
                            family: "'Inter', sans-serif",
                          }
                        }
                      }
                    },
                    elements: {
                      line: {
                        tension: 0.4,
                        borderWidth: 3,
                        borderColor: '#3b82f6',
                        fill: true,
                        backgroundColor: (context) => {
                          const ctx = context.chart.ctx;
                          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
                          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
                          return gradient;
                        }
                      },
                      point: {
                        radius: 4,
                        hoverRadius: 6,
                        backgroundColor: '#3b82f6',
                        borderWidth: 2,
                        borderColor: '#fff'
                      }
                    }
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <BarChart3 className="w-12 h-12 mb-2 opacity-50" />
                  <p>No data available for the selected period</p>
                </div>
              )}
            </div>
          </div>

          {/* Issue Composition Pie Chart */}
          <div className="glass-panel p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Issue Composition
            </h3>
            <div className="h-64 flex items-center justify-center">
              {stats && Object.keys(stats.byType).length > 0 ? (
                <Pie
                  data={generatePieChartData(stats.byType, [
                    'rgba(59, 130, 246, 0.8)',   // Blue
                    'rgba(168, 85, 247, 0.8)',   // Purple
                    'rgba(236, 72, 153, 0.8)',   // Pink
                    'rgba(16, 185, 129, 0.8)',   // Emerald
                    'rgba(245, 158, 11, 0.8)',   // Amber
                    'rgba(99, 102, 241, 0.8)',   // Indigo
                  ])}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          usePointStyle: true,
                          padding: 20,
                          font: {
                            family: "'Inter', sans-serif",
                            size: 11
                          }
                        }
                      }
                    },
                    elements: {
                      arc: {
                        borderWidth: 2,
                        borderColor: '#fff'
                      }
                    }
                  }}
                />
              ) : (
                <div className="text-center text-gray-500">No data available</div>
              )}
            </div>
          </div>
        </div>

        {/* AI Insights & Advanced Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 animate-slide-up" style={{ animationDelay: '0.35s' }}>
          {/* AI Insights Panel */}
          <div className="glass-panel p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Lightbulb className="w-24 h-24 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              AI Insights
            </h3>
            <div className="space-y-4">
              {insights.map((insight, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${insight.type === 'critical' ? 'bg-red-50 border-red-100' :
                  insight.type === 'warning' ? 'bg-orange-50 border-orange-100' :
                    insight.type === 'positive' ? 'bg-green-50 border-green-100' :
                      'bg-blue-50 border-blue-100'
                  }`}>
                  <h4 className={`text-sm font-bold mb-1 ${insight.type === 'critical' ? 'text-red-800' :
                    insight.type === 'warning' ? 'text-orange-800' :
                      insight.type === 'positive' ? 'text-green-800' :
                        'text-blue-800'
                    }`}>{insight.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{insight.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Response Time Distribution */}
          <div className="glass-panel p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Response Time
            </h3>
            <div className="h-64 flex items-end justify-between gap-4 px-2">
              {Object.entries(timeStats).map(([label, count], idx) => {
                const max = Math.max(...Object.values(timeStats));
                const height = max > 0 ? (count / max) * 100 : 0;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group">
                    <div className="w-full bg-gray-100 rounded-t-lg relative h-48 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-500 rounded-t-lg relative group-hover:scale-y-105 origin-bottom"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          {count}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-500 mt-3 text-center">{label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Reporters */}
          <div className="glass-panel p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Medal className="w-5 h-5 text-amber-500" />
              Top Reporters
            </h3>
            <div className="space-y-4">
              {reporterStats.map((reporter, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 hover:bg-white/50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-amber-100 text-amber-700' :
                      idx === 1 ? 'bg-gray-100 text-gray-700' :
                        idx === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-slate-100 text-slate-600'
                      }`}>
                      {idx + 1}
                    </div>
                    <span className="font-medium text-gray-700">{reporter.name}</span>
                  </div>
                  <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold">
                    {reporter.count}
                  </div>
                </div>
              ))}
              {reporterStats.length === 0 && (
                <div className="text-center text-gray-500 py-8">No data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Department Performance */}
        <div className="glass-panel p-8 mb-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Department Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Department</th>
                  <th className="text-center py-4 px-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Issues</th>
                  <th className="text-center py-4 px-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Resolution Rate</th>
                  <th className="text-center py-4 px-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Efficiency</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {departmentStats.map((dept, index) => (
                  <tr key={index} className="border-b border-gray-100 last:border-0 hover:bg-white/40 transition-colors">
                    <td className="py-4 px-4 font-medium text-gray-900 flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${dept.efficiencyScore >= 80 ? 'bg-green-500' : dept.efficiencyScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                      {dept.name}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2 py-1 bg-gray-100 rounded-md font-mono text-xs font-bold text-gray-600">
                        {dept.issuesAssigned}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-full bg-gray-100 rounded-full h-2 max-w-[100px] mx-auto overflow-hidden">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${dept.resolutionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">{dept.resolutionRate.toFixed(0)}%</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${dept.efficiencyScore >= 80 ? 'bg-green-100 text-green-800' :
                        dept.efficiencyScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        {dept.efficiencyScore.toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-gray-600">
                      {dept.avgResolutionTime.toFixed(1)} d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Geographic Analysis */}
        <div className="glass-panel p-8 mb-8 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-red-600" />
            Geographic Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/50 rounded-xl p-6 border border-white/60 shadow-sm text-center group hover:bg-white/70 transition-all">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Issue Density</h4>
              <div className="text-4xl font-extrabold text-gray-900 group-hover:scale-110 transition-transform duration-300">{geographicData.length}</div>
              <p className="text-xs text-gray-400 mt-1">Total Locations</p>
            </div>
            <div className="bg-white/50 rounded-xl p-6 border border-white/60 shadow-sm text-center group hover:bg-white/70 transition-all">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Hotspots</h4>
              <div className="text-4xl font-extrabold text-red-600 group-hover:scale-110 transition-transform duration-300">
                {geographicData.filter(d => d.priority === 'critical' || d.priority === 'high').length}
              </div>
              <p className="text-xs text-gray-400 mt-1">High Priority Areas</p>
            </div>
            <div className="bg-white/50 rounded-xl p-6 border border-white/60 shadow-sm text-center group hover:bg-white/70 transition-all">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Coverage</h4>
              <div className="text-4xl font-extrabold text-blue-600 group-hover:scale-110 transition-transform duration-300">
                {new Set(geographicData.map(d => `${d.latitude.toFixed(2)},${d.longitude.toFixed(2)}`)).size}
              </div>
              <p className="text-xs text-gray-400 mt-1">Unique Zones</p>
            </div>
          </div>
        </div>

        {/* Monthly Reports Table */}
        <div className="glass-panel p-8 animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-teal-600" />
            Monthly Reports
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 border-b border-gray-200">
                  <th className="py-3 px-4 text-left font-semibold">Month</th>
                  <th className="py-3 px-4 text-center font-semibold">Total Issues</th>
                  <th className="py-3 px-4 text-center font-semibold">Resolved</th>
                  <th className="py-3 px-4 text-center font-semibold">Efficiency</th>
                  <th className="py-3 px-4 text-right font-semibold">Est. Cost</th>
                  <th className="py-3 px-4 text-center font-semibold">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlyReports.map((report, idx) => (
                  <tr key={idx} className="hover:bg-white/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {new Date(report.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">{report.totalIssues}</td>
                    <td className="py-3 px-4 text-center text-green-600 font-medium">{report.resolvedIssues}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${report.efficiencyScore}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-500">{report.efficiencyScore.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-600">₹{report.totalCost.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${report.trendIndicator === 'up' ? 'bg-green-50 text-green-700' :
                        report.trendIndicator === 'down' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {report.trendIndicator === 'up' && <TrendingUp className="w-3 h-3" />}
                        {report.trendIndicator === 'down' && <TrendingUp className="w-3 h-3 transform rotate-180" />}
                        {report.trendIndicator === 'stable' && <Activity className="w-3 h-3" />}
                        {report.trendIndicator === 'up' ? 'Improving' : report.trendIndicator === 'down' ? 'Declining' : 'Stable'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
