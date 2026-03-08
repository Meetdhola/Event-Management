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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
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
      <div className="hidden lg:block w-64 shrink-0">
        <Sidebar isOpen={true} onClose={() => { }} />
      </div>

      <main className="flex-1 w-full min-w-0 transition-all duration-300 main-content">
        <Navbar />
        <MobileHeader />
        <div className="px-4 sm:px-6 lg:px-8 pt-20 lg:pt-6 w-full overflow-x-hidden min-h-[calc(100vh-80px)]">
          <Routes>
            <Route path="/dashboard" element={<ProtectedRoute><DashboardWrapper /></ProtectedRoute>} />
            <Route path="/create-event" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/:section" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/vendor" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />
            <Route path="/volunteer" element={<ProtectedRoute><VolunteerDashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/hire-manager" element={<ProtectedRoute><HireManager /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/rejected-events" element={<ProtectedRoute><RejectedEvents /></ProtectedRoute>} />
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
