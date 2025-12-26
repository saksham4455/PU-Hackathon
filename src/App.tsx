import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PublicDashboard } from './pages/PublicDashboard';
import { UnifiedLoginPage } from './pages/UnifiedLoginPage';
import { DepartmentHeadDashboard } from './pages/DepartmentHeadDashboard';
import { DepartmentHeadIssueDetail } from './pages/DepartmentHeadIssueDetail';
import { DepartmentHeadWorkerManagement } from './pages/DepartmentHeadWorkerManagement';
import { DepartmentWorkerDashboard } from './pages/DepartmentWorkerDashboard';
import { DepartmentWorkerIssueDetail } from './pages/DepartmentWorkerIssueDetail';
import { ReportIssuePage } from './pages/ReportIssuePage';
import { MyComplaintsPage } from './pages/MyComplaintsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminIssueDetail } from './pages/AdminIssueDetail';
import { AdminActionPanel } from './pages/AdminActionPanel';
import { UserProfilePage } from './pages/UserProfilePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/Toast/ToastContainer';

function AppContent() {
  const { loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-xl font-heading text-gray-600 animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  // Check if current route is an admin route
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex flex-col">
        <ToastContainer />
        <div key={location.pathname} className="animate-slideIn flex-grow flex flex-col">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<><Navbar /><PublicDashboard /></>} />
            <Route path="/login" element={<UnifiedLoginPage />} />
            <Route path="/admin-login" element={<Navigate to="/login" replace />} />

            {/* User routes */}
            <Route path="/report" element={<><Navbar /><ReportIssuePage /></>} />
            <Route path="/my-complaints" element={<><Navbar /><MyComplaintsPage /></>} />
            <Route path="/user-profile" element={<><Navbar /><UserProfilePage /></>} />
            <Route path="/profile" element={<><Navbar /><ProfilePage /></>} />

            {/* Super Admin routes */}
            <Route path="/admin" element={<><Navbar /><AdminDashboard /></>} />
            <Route path="/admin/dashboard" element={<><Navbar /><AdminDashboard /></>} />
            <Route path="/admin/issue/:issueId" element={<><Navbar /><AdminIssueDetail /></>} />
            <Route path="/admin/action-panel" element={<><Navbar /><AdminActionPanel /></>} />
            <Route path="/admin/analytics" element={<><Navbar /><AnalyticsPage /></>} />

            {/* Department Head routes */}
            <Route path="/dept-head/dashboard" element={<><Navbar /><DepartmentHeadDashboard /></>} />
            <Route path="/dept-head/issues/:id" element={<><Navbar /><DepartmentHeadIssueDetail /></>} />
            <Route path="/dept-head/analytics" element={<><Navbar /><DepartmentHeadIssueDetail /></>} />
            <Route path="/dept-head/workers" element={<><Navbar /><DepartmentHeadWorkerManagement /></>} />

            {/* Department Worker routes */}
            <Route path="/worker/dashboard" element={<><Navbar /><DepartmentWorkerDashboard /></>} />
            <Route path="/worker/issues/:id" element={<><Navbar /><DepartmentWorkerIssueDetail /></>} />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
        {!isAdminRoute && <Footer />}
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
