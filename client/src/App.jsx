import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import AdminDashboard from './pages/AdminDashboard';
import VendorDashboard from './pages/VendorDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AttendeeDashboard from './pages/AttendeeDashboard';
import ClientDashboard from './pages/ClientDashboard';
import HireManager from './pages/HireManager';
import Chat from './pages/Chat';
import AICommandCenter from './components/AICommandCenter';
import ManagerAnalytics from './pages/ManagerAnalytics';
import RejectedEvents from './pages/RejectedEvents';
import Profile from './pages/Profile';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import BottomNavigation from './components/BottomNavigation';
import ProtectedRoute from './components/ProtectedRoute';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import { ThemeProvider } from './context/ThemeContext';
import MobileHeader from './components/MobileHeader';

const DashboardWrapper = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'Vendor': return <VendorDashboard />;
    case 'Volunteer': return <VolunteerDashboard />;
    case 'Attendee': return <AttendeeDashboard />;
    case 'Client': return <ClientDashboard />;
    case 'Admin':
    default: return <Dashboard />;
  }
};

const AppLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />

        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin shadow-[0_0_40px_rgba(212,175,55,0.2)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-primary/20 blur-xl animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] font-black text-white/70 uppercase tracking-[0.5em] animate-pulse">Initializing System</span>
            <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    const isPublicPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register';
    if (!isPublicPage) {
      return <Navigate to="/" replace />;
    }
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    );
  }

  // If user is logged in but tries to access login/register/home, redirect to dashboard
  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Sidebar handles Desktop Navigation */}
      <div className="hidden lg:block w-72 shrink-0">
        <Sidebar isOpen={true} onClose={() => { }} />
      </div>

      <main className="flex-1 w-full min-w-0 transition-all duration-300 main-content">
        <Navbar />
        <MobileHeader />
        <div className="px-4 sm:px-6 lg:px-8 pt-20 lg:pt-32 w-full overflow-x-hidden min-h-[calc(100vh-80px)]">
          <Routes>
            <Route path="/dashboard" element={<ProtectedRoute><DashboardWrapper /></ProtectedRoute>} />
            <Route path="/create-event" element={<ProtectedRoute allowedRoles={['EventManager', 'Admin']}><CreateEvent /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/:section" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/vendor" element={<ProtectedRoute allowedRoles={['Vendor', 'Admin']}><VendorDashboard /></ProtectedRoute>} />
            <Route path="/volunteer" element={<ProtectedRoute allowedRoles={['Volunteer', 'Admin']}><VolunteerDashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/hire-manager" element={<ProtectedRoute allowedRoles={['Client', 'Admin']}><HireManager /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/ai-center" element={<ProtectedRoute allowedRoles={['EventManager', 'Admin']}><AICommandCenter /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={['EventManager', 'Admin']}><ManagerAnalytics /></ProtectedRoute>} />
            <Route path="/rejected-events" element={<ProtectedRoute allowedRoles={['EventManager', 'Admin']}><RejectedEvents /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>

      {/* App-like bottom navigation for mobile */}
      <BottomNavigation />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'glass-panel text-foreground',
              style: {
                background: 'rgba(var(--bg-surface), 0.8)',
                color: 'currentColor',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(120, 120, 120, 0.1)',
                borderRadius: '16px'
              },
            }}
          />
          <AppLayout />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
