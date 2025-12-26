import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, CheckCircle, Plus, TrendingUp, ArrowRight, Activity, Shield } from 'lucide-react';
import { localStorageService, Issue, User } from '../lib/localStorage';
import { useAuth } from '../contexts/AuthContext';
import { calculateUserStats } from '../lib/gamification';

export function PublicDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ resolved: 0, active: 0, contributors: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [issuesResult, usersResult] = await Promise.all([
        localStorageService.getIssues(),
        localStorageService.getUsers()
      ]);

      if (issuesResult.error) throw issuesResult.error;
      if (usersResult.error) throw usersResult.error;

      setIssues(issuesResult.issues);
      setUsers(usersResult.users);

      // Calculate real-time stats
      setStats({
        resolved: issuesResult.issues.filter(i => i.status === 'resolved').length,
        active: issuesResult.issues.filter(i => i.status !== 'resolved').length,
        contributors: usersResult.users.length
      });

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate top contributors with gamification
  const calculateTopContributors = () => {
    const uniqueUsers = [...new Set(
      issues
        .filter(issue => issue.user_id && !issue.is_anonymous)
        .map(issue => issue.user_id)
    )];

    const contributors = uniqueUsers.map(userId => {
      const user = users.find(u => u.id === userId);
      const stats = calculateUserStats(userId, issues);
      return {
        userId,
        userName: user?.full_name || 'Anonymous User',
        count: stats.issuesReported,
        resolved: stats.issuesResolved,
        points: stats.reputationPoints,
        resolutionRate: stats.resolutionRate
      };
    });

    return contributors
      .sort((a, b) => b.points - a.points || b.count - a.count)
      .slice(0, 3);
  };

  const topContributors = calculateTopContributors();
  const recentResolved = issues.filter(i => i.status === 'resolved')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-xl font-heading text-gray-600 animate-pulse">Loading City Pulse...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex-grow relative overflow-x-hidden">
      {/* Abstract Background Shapes */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">

        {/* Hero Section */}
        <section className="relative pt-20 pb-24 md:pt-32 md:pb-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white/40 shadow-sm mb-8 animate-slide-up">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm font-semibold text-gray-600 tracking-wide uppercase">Live Issue Tracking System</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Better Cities, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
                Built Together.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Join {stats.contributors} citizens transforming their neighborhoods. Report issues, track progress, and see visible results in your community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <button
                onClick={() => navigate(user ? '/report' : '/login')}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <Plus className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Report an Issue</span>
              </button>
              <button
                onClick={() => navigate(user ? '/my-complaints' : '/login')}
                className="px-8 py-4 bg-white text-gray-700 font-bold rounded-2xl shadow-md hover:shadow-xl border border-gray-100 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <Activity className="w-5 h-5 text-gray-500" />
                <span>Track Progress</span>
              </button>
            </div>
          </div>
        </section>

        {/* Live Impact Stats */}
        <section className="relative -mt-12 mb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="glass-panel p-8 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-8 text-center animate-fade-in">
              <div className="group">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-4xl font-extrabold text-gray-900 mb-2">{stats.resolved}+</div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Issues Resolved</div>
              </div>
              <div className="group border-t md:border-t-0 md:border-l border-gray-100 pt-8 md:pt-0">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-4xl font-extrabold text-gray-900 mb-2">{stats.contributors}</div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Active Citizens</div>
              </div>
              <div className="group border-t md:border-t-0 md:border-l border-gray-100 pt-8 md:pt-0">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-orange-100 rounded-2xl group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-4xl font-extrabold text-gray-900 mb-2">{stats.active}</div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">In Progress</div>
              </div>
            </div>
          </div>
        </section>

        {/* Recently Resolved Ticker */}
        {recentResolved.length > 0 && (
          <section className="mb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  Recently Resolved
                </h2>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                  View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentResolved.map((issue) => (
                  <div key={issue.id} className="glass-panel p-6 rounded-2xl hover:scale-[1.02] transition-transform duration-300 flex flex-col justify-between min-h-[200px]">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide">Fixed</span>
                        <span className="text-xs text-gray-500 font-medium">{new Date(issue.updated_at).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-3 text-lg leading-snug line-clamp-3">{issue.description}</h3>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-auto pt-4 border-t border-gray-100">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{issue.location_address || 'City Location'}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* How It Works - Glassmorphic Cards */}
        <section className="mb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-lg text-gray-600">Report an issue in 3 simple steps</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-panel p-8 rounded-3xl text-center relative group hover:-translate-y-2 transition-transform duration-300">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-blue-600 text-white rounded-2xl rotate-45 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                  <span className="-rotate-45 text-xl font-bold">1</span>
                </div>
                <div className="mt-8 mb-6 h-40 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <MapPin className="w-16 h-16 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Snap & Locate</h3>
                <p className="text-gray-600">Take a photo of the issue and pinpoint the location on the map.</p>
              </div>

              <div className="glass-panel p-8 rounded-3xl text-center relative group hover:-translate-y-2 transition-transform duration-300 decoration-purple-500">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-purple-600 text-white rounded-2xl rotate-45 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                  <span className="-rotate-45 text-xl font-bold">2</span>
                </div>
                <div className="mt-8 mb-6 h-40 bg-purple-50 rounded-2xl flex items-center justify-center">
                  <Shield className="w-16 h-16 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Admin Verification</h3>
                <p className="text-gray-600">City officials verify your report and assign it to the right department.</p>
              </div>

              <div className="glass-panel p-8 rounded-3xl text-center relative group hover:-translate-y-2 transition-transform duration-300">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-green-600 text-white rounded-2xl rotate-45 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                  <span className="-rotate-45 text-xl font-bold">3</span>
                </div>
                <div className="mt-8 mb-6 h-40 bg-green-50 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Get It Resolved</h3>
                <p className="text-gray-600">Track progress in real-time and get notified when it's fixed.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Gamification / Leaderboard Teaser */}
        <section className="mb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto glass-panel rounded-[3rem] p-12 relative overflow-hidden bg-gradient-to-r from-indigo-900 to-purple-900 text-white">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)' }}></div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm font-semibold mb-6 border border-white/20">
                  🏆 Community Champions
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                  Earn Badges & <br /> Make an Impact
                </h2>
                <p className="text-indigo-200 text-lg mb-8 leading-relaxed">
                  Join the leaderboard of top contributors. Earn reputation points for every verified report and become a guardian of your city.
                </p>
                <button
                  onClick={() => navigate(user ? '/report' : '/login')}
                  className="px-8 py-4 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
                >
                  Start Earning Points
                </button>
              </div>

              <div className="relative">
                {/* Mock Leaderboard Card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-yellow-400" /> Top Contributors
                  </h3>
                  <div className="space-y-4">
                    {topContributors.map((user, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                          idx === 1 ? 'bg-gray-300 text-gray-900' :
                            'bg-orange-400 text-orange-900'
                          }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold">{user.userName}</div>
                          <div className="text-xs text-indigo-300">{user.count} Reports</div>
                        </div>
                        <div className="font-mono font-bold text-yellow-400">{user.points} pts</div>
                      </div>
                    ))}
                    {topContributors.length === 0 && <div className="text-center opacity-50 py-4">Be the first to top the charts!</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Category Grid (What Can You Report) */}
        <section className="mb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">What Can You Report?</h2>
              <p className="text-gray-600">We handle a wide range of civic issues</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { name: 'Potholes', icon: '🚧', color: 'hover:bg-red-50 hover:border-red-200' },
                { name: 'Lighting', icon: '💡', color: 'hover:bg-yellow-50 hover:border-yellow-200' },
                { name: 'Garbage', icon: '🗑️', color: 'hover:bg-green-50 hover:border-green-200' },
                { name: 'Water', icon: '💧', color: 'hover:bg-blue-50 hover:border-blue-200' },
                { name: 'Traffic', icon: '🚦', color: 'hover:bg-orange-50 hover:border-orange-200' },
                { name: 'Graffiti', icon: '🎨', color: 'hover:bg-purple-50 hover:border-purple-200' },
              ].map((item, idx) => (
                <div key={idx} className={`glass-panel p-6 rounded-2xl text-center cursor-pointer transition-all duration-300 group ${item.color} border border-transparent`}>
                  <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">{item.icon}</div>
                  <div className="font-semibold text-gray-700 group-hover:text-gray-900">{item.name}</div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => navigate(user ? '/report' : '/login')}
                className="text-blue-600 font-semibold hover:text-blue-800 transition-colors inline-flex items-center gap-2"
              >
                View All Categories <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
