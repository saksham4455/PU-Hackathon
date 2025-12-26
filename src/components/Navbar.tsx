import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, User, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname.startsWith('/admin')) {
      return true;
    }
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await signOut();
    setMobileMenuOpen(false);
    navigate('/home');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-14">
          {/* Logo Section */}
          <Link
            to="/home"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-semibold text-gray-900">Improve My City</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center space-x-0">
              <Link
                to="/home"
                className={`relative px-4 py-4 text-sm font-medium transition-colors ${isActive('/home')
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg'
                  }`}
              >
                Home
                {isActive('/home') && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
                )}
              </Link>

              {user && (profile?.role === 'citizen' || !profile?.role) && (
                <>
                  <span className="text-gray-300">|</span>
                  <Link
                    to="/report"
                    className={`relative px-4 py-4 text-sm font-medium transition-colors ${isActive('/report')
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-gray-900'
                      }`}
                  >
                    Report an Issue
                    {isActive('/report') && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
                    )}
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link
                    to="/my-complaints"
                    className={`relative px-4 py-4 text-sm font-medium transition-colors ${isActive('/my-complaints')
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-gray-900'
                      }`}
                  >
                    Track Progress
                    {isActive('/my-complaints') && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
                    )}
                  </Link>
                </>
              )}

              {user && profile?.role === 'super_admin' && (
                <>
                  <span className="text-gray-300">|</span>
                  <Link
                    to="/admin"
                    className={`relative px-4 py-4 text-sm font-medium transition-colors ${isActive('/admin')
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-gray-900'
                      }`}
                  >
                    Admin Dashboard
                    {isActive('/admin') && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
                    )}
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link
                    to="/admin/action-panel"
                    className={`relative px-4 py-4 text-sm font-medium transition-colors ${isActive('/admin/action-panel')
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-gray-900'
                      }`}
                  >
                    Action Panel
                    {isActive('/admin/action-panel') && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
                    )}
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link
                    to="/admin/analytics"
                    className={`relative px-4 py-4 text-sm font-medium transition-colors ${isActive('/admin/analytics')
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-gray-900'
                      }`}
                  >
                    Analytics
                    {isActive('/admin/analytics') && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
                    )}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100 transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Right Section - User Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <User className="w-4 h-4 text-gray-500" />
                <Link
                  to="/profile"
                  className="text-sm text-gray-700 hover:text-blue-600 transition"
                >
                  {profile?.full_name}
                </Link>
                {profile?.role === 'super_admin' && (
                  <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full font-medium">
                    Admin
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="ml-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/home"
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/home')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Home
              </Link>

              {user && (profile?.role === 'citizen' || !profile?.role) && (
                <>
                  <Link
                    to="/report"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/report')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    Report an Issue
                  </Link>
                  <Link
                    to="/my-complaints"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/my-complaints')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    Track Progress
                  </Link>
                </>
              )}

              {user && profile?.role === 'super_admin' && (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/admin')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    Admin Dashboard
                  </Link>
                  <Link
                    to="/admin/action-panel"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/admin/action-panel')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    Action Panel
                  </Link>
                  <Link
                    to="/admin/analytics"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/admin/analytics')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    Analytics
                  </Link>
                </>
              )}

              <div className="border-t border-gray-200 pt-3 mt-3">
                {user ? (
                  <div className="space-y-2">
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-2 w-full text-left px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/profile')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <User className="w-4 h-4" />
                      <span>{profile?.full_name}</span>
                      {profile?.role === 'super_admin' && (
                        <span className="ml-auto px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full font-medium">
                          Admin
                        </span>
                      )}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
