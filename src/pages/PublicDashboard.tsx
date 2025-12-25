import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, AlertTriangle, Users, CheckCircle, Plus, ClipboardList } from 'lucide-react';
import { localStorageService, Issue, User } from '../lib/localStorage';
import { useAuth } from '../contexts/AuthContext';
import { calculateUserStats, getBadge } from '../lib/gamification';

// Image paths from public folder
const heroBgImg = '/images/background.jpg';
const potholesImg = '/images/43960-Repairing-Potholes-1.webp';
const garbageImg = '/images/garbage.jpg';
const streetlightImg = '/images/streetlight.jpg';
const waterleakImg = '/images/waterleak.jpg';
const brokensidewalkImg = '/images/brokensidewalk.jpg';
const traficsignalImg = '/images/traficsignal.jpg';
const drainageImg = '/images/drainageproblem.jpg';
const graffitiImg = '/images/graffiti.jpeg';
const treeImg = '/images/tree-maintenance.jpg';
const noiseImg = '/images/noise-problem.jpg';
const parkingImg = '/images/parking-problem.jpg';

export function PublicDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };


  // Calculate top contributors with gamification
  const calculateTopContributors = () => {
    // Get unique user IDs from non-anonymous issues
    const uniqueUsers = [...new Set(
      issues
        .filter(issue => issue.user_id && !issue.is_anonymous)
        .map(issue => issue.user_id)
    )];

    // Calculate stats for each user
    const contributors = uniqueUsers.map(userId => {
      const user = users.find(u => u.id === userId);
      const stats = calculateUserStats(userId, issues);

      return {
        userId,
        userName: user?.full_name || 'Anonymous User',
        count: stats.issuesReported,
        resolved: stats.issuesResolved,
        points: stats.reputationPoints,
        badges: stats.badges,
        resolutionRate: stats.resolutionRate
      };
    });

    // Sort by points (primary) then by issue count (secondary)
    return contributors
      .sort((a, b) => b.points - a.points || b.count - a.count)
      .slice(0, 3);
  };

  const topContributors = calculateTopContributors();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-xl font-heading text-gray-600 animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex-grow">
      {/* Top Banner - Social Proof */}
      <div className="bg-gradient-to-r from-accent-50 to-yellow-50 border-b border-accent-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-end flex-wrap">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-6 h-6 bg-accent-100 rounded-full">
                <AlertTriangle className="w-4 h-4 text-accent-600" />
              </div>
              <span className="text-xs font-semibold text-gray-900">
                Join <span className="text-gradient font-bold">{users.length} citizens</span> making a difference in their community
              </span>
            </div>
            {!user && (
              <button
                onClick={() => navigate('/login')}
                className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors duration-300 hover:scale-105 ml-4"
              >
                Get Started Free →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-600 via-purple-600 to-primary-800 text-white overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url(${heroBgImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}></div>
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/60 via-purple-900/60 to-primary-800/70"></div>
        </div>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center animate-fade-in">
            <h1 className="text-6xl md:text-7xl font-heading font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Your Voice Matters
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-4xl mx-auto leading-relaxed">
              Empowering citizens to report, track, and resolve city issues together.
              Make your neighborhood better, one issue at a time.
            </p>

            {/* Action Buttons for Citizens */}
            {user && profile?.role === 'citizen' && (
              <div className="flex flex-col sm:flex-row gap-6 justify-center animate-slide-up">
                <button
                  onClick={() => navigate('/report')}
                  className="group flex items-center justify-center space-x-3 bg-white text-primary-600 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full group-hover:bg-primary-200 transition-colors">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span>Report an Issue</span>
                </button>
                <button
                  onClick={() => navigate('/my-complaints')}
                  className="group flex items-center justify-center space-x-3 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:from-secondary-600 hover:to-secondary-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <span>My Complaints</span>
                </button>
              </div>
            )}

            {/* Login CTA for non-authenticated users */}
            {!user && (
              <div className="flex flex-col sm:flex-row gap-6 justify-center animate-slide-up">
                <button
                  onClick={() => navigate('/login')}
                  className="group flex items-center justify-center space-x-3 bg-white text-primary-600 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full group-hover:bg-primary-200 transition-colors">
                    <Users className="w-5 h-5" />
                  </div>
                  <span>Sign In to Report Issues</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Contributors Leaderboard */}
      {topContributors.length > 0 && (
        <div className="bg-white border-t border-gray-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
                Top <span className="text-gradient">Contributors</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">Recognizing citizens who make a difference in our community</p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 lg:gap-16 px-4">
              {/* Second Place (Silver) */}
              {topContributors.length > 1 && (
                <div className="order-2 md:order-1 w-full md:w-auto mb-6 md:mb-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <div className="relative bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8 text-center transform hover:scale-105 transition-all duration-300">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-3xl">🥈</span>
                    </div>
                    <div className="pt-8">
                      <div className="text-3xl font-heading font-bold text-gray-700 mb-2">#{2}</div>
                      <div className="text-xl font-bold text-gray-900 mb-1">{topContributors[1].userName}</div>
                      <div className="text-sm text-gray-600 mb-2">Silver Contributor</div>

                      {/* Points */}
                      <div className="mt-3 text-3xl font-bold text-gray-600">⭐ {topContributors[1].points} pts</div>

                      {/* Badges */}
                      {topContributors[1].badges && topContributors[1].badges.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center mt-2">
                          {topContributors[1].badges.slice(0, 3).map((badgeId: string) => {
                            const badge = getBadge(badgeId);
                            return badge ? (
                              <span key={badgeId} className="text-lg" title={badge.name}>
                                {badge.icon}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}

                      <div className="mt-2 text-sm text-gray-600">{topContributors[1].count} reports • {topContributors[1].resolved} resolved</div>
                    </div>
                  </div>
                </div>
              )}

              {/* First Place (Gold) */}
              {topContributors.length > 0 && (
                <div className="order-1 md:order-2 w-full md:w-auto mb-6 md:mb-0 animate-fade-in">
                  <div className="relative bg-gradient-to-br from-yellow-50 to-amber-50 rounded-3xl shadow-2xl border-4 border-yellow-400 p-10 text-center transform hover:scale-110 transition-all duration-300">
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow">
                      <span className="text-5xl">🥇</span>
                    </div>
                    <div className="pt-12">
                      <div className="text-4xl font-heading font-bold text-yellow-600 mb-2">#{1}</div>
                      <div className="text-2xl font-bold text-gray-900 mb-2">{topContributors[0].userName}</div>
                      <div className="text-sm font-semibold text-yellow-600 uppercase tracking-wide">Gold Contributor</div>

                      {/* Points */}
                      <div className="mt-4 text-4xl font-bold text-yellow-600">⭐ {topContributors[0].points} pts</div>

                      {/* Badges */}
                      {topContributors[0].badges && topContributors[0].badges.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center mt-3">
                          {topContributors[0].badges.map((badgeId: string) => {
                            const badge = getBadge(badgeId);
                            return badge ? (
                              <span key={badgeId} className="text-2xl" title={badge.name}>
                                {badge.icon}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}

                      <div className="mt-3 text-lg text-gray-700 font-medium">{topContributors[0].count} reports • {topContributors[0].resolved} resolved</div>
                      <div className="mt-1 text-sm text-yellow-600">🎯 {topContributors[0].resolutionRate}% resolution rate</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Third Place (Bronze) */}
              {topContributors.length > 2 && (
                <div className="order-3 w-full md:w-auto mb-6 md:mb-0 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <div className="relative bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8 text-center transform hover:scale-105 transition-all duration-300">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-amber-200 to-orange-300 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-3xl">🥉</span>
                    </div>
                    <div className="pt-8">
                      <div className="text-3xl font-heading font-bold text-gray-700 mb-2">#{3}</div>
                      <div className="text-xl font-bold text-gray-900 mb-1">{topContributors[2].userName}</div>
                      <div className="text-sm text-gray-600 mb-2">Bronze Contributor</div>

                      {/* Points */}
                      <div className="mt-3 text-3xl font-bold text-gray-600">⭐ {topContributors[2].points} pts</div>

                      {/* Badges */}
                      {topContributors[2].badges && topContributors[2].badges.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center mt-2">
                          {topContributors[2].badges.slice(0, 3).map((badgeId: string) => {
                            const badge = getBadge(badgeId);
                            return badge ? (
                              <span key={badgeId} className="text-lg" title={badge.name}>
                                {badge.icon}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}

                      <div className="mt-2 text-sm text-gray-600">{topContributors[2].count} reports • {topContributors[2].resolved} resolved</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Call to Action */}
            <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <p className="text-lg text-gray-600 mb-4">Be the next top contributor!</p>
              <button
                onClick={() => navigate(user ? '/report' : '/login')}
                className="group inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-primary-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span>{user ? 'Report an Issue' : 'Sign In to Report'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How It Works Section */}
      <div className="bg-white border-t border-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Making city improvements is simple and transparent</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center group animate-fade-in">
              <div className="relative mb-6">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Plus className="w-10 h-10 text-primary-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
              </div>
              <h3 className="text-2xl font-heading font-bold mb-4 text-gray-900">Report an Issue</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Submit issues with photos, location, and priority level</p>
            </div>

            <div className="text-center group animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="relative mb-6">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-accent-100 to-accent-200 rounded-3xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <ClipboardList className="w-10 h-10 text-accent-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-heading font-bold mb-4 text-gray-900">Track Progress</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Follow your issue through the resolution process in real-time</p>
            </div>

            <div className="text-center group animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="relative mb-6">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-3xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <CheckCircle className="w-10 h-10 text-secondary-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-heading font-bold mb-4 text-gray-900">See Results</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Watch your city improve as issues get resolved</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl">
        {/* Why Choose Us Section */}
        <div className="relative bg-white py-16 mb-12 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6">
                Why Choose <span className="text-gradient">Our Platform?</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-2">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3 text-gray-900">Community Driven</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Built for citizens, by citizens</p>
              </div>

              <div className="text-center bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-2">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3 text-gray-900">Real-Time Updates</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Track issues as they're being resolved</p>
              </div>

              <div className="text-center bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-2">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent-100 to-accent-200 rounded-2xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="w-8 h-8 text-accent-600" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3 text-gray-900">Priority System</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Critical issues get addressed first</p>
              </div>

              <div className="text-center bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-2">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-2xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-8 h-8 text-secondary-600" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3 text-gray-900">Transparency</h3>
                <p className="text-gray-600 text-sm leading-relaxed">See all issues and their status publicly</p>
              </div>
            </div>
          </div>
        </div>

        {/* What Can You Report Section */}
        <div className="card-enhanced p-8 mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center text-gray-900 mb-8">
            What Can You <span className="text-gradient">Report?</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Potholes', icon: '🚧', color: 'from-red-100 to-red-200', textColor: 'text-red-600', bgImage: potholesImg },
              { name: 'Garbage', icon: '🗑️', color: 'from-green-100 to-green-200', textColor: 'text-green-600', bgImage: garbageImg },
              { name: 'Street Lights', icon: '💡', color: 'from-yellow-100 to-yellow-200', textColor: 'text-yellow-600', bgImage: streetlightImg },
              { name: 'Water Leaks', icon: '💧', color: 'from-blue-100 to-blue-200', textColor: 'text-blue-600', bgImage: waterleakImg },
              { name: 'Broken Sidewalks', icon: '🚶', color: 'from-gray-100 to-gray-200', textColor: 'text-gray-600', bgImage: brokensidewalkImg },
              { name: 'Traffic Signals', icon: '🚦', color: 'from-orange-100 to-orange-200', textColor: 'text-orange-600', bgImage: traficsignalImg },
              { name: 'Drainage', icon: '🌊', color: 'from-cyan-100 to-cyan-200', textColor: 'text-cyan-600', bgImage: drainageImg },
              { name: 'Graffiti', icon: '🎨', color: 'from-purple-100 to-purple-200', textColor: 'text-purple-600', bgImage: graffitiImg },
              { name: 'Tree Maintenance', icon: '🌳', color: 'from-emerald-100 to-emerald-200', textColor: 'text-emerald-600', bgImage: treeImg },
              { name: 'Noise', icon: '🔊', color: 'from-pink-100 to-pink-200', textColor: 'text-pink-600', bgImage: noiseImg },
              { name: 'Parking', icon: '🅿️', color: 'from-indigo-100 to-indigo-200', textColor: 'text-indigo-600', bgImage: parkingImg },
              { name: 'Other', icon: '📋', color: 'from-slate-100 to-slate-200', textColor: 'text-slate-600', bgImage: null }
            ].map((item) => (
              <div
                key={item.name}
                className="group rounded-xl p-6 text-center transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-lg border border-gray-100 hover:border-primary-200 relative overflow-hidden"
                style={{
                  backgroundImage: item.bgImage ? `url(${item.bgImage})` : 'linear-gradient(to bottom right, #f8fafc, #e0e7ff)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/10 group-hover:from-white/15 group-hover:to-white/5 transition-all duration-300"></div>

                <div className="relative z-10">
                  <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  <span className={`font-semibold text-gray-800 group-hover:${item.textColor} transition-colors relative z-10`} style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}>{item.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
