import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Home from './pages/Home';
import CaseStart from './pages/CaseStart';
import Cases from './pages/Cases';
import AppointmentWatchPage from './pages/AppointmentWatch';
import Profile from './pages/Profile.jsx';
import Onboarding from './pages/Onboarding';
import IdentityVault from './pages/IdentityVault';
import DigitalVault from './pages/DigitalVault';
import PassportDemo from './pages/PassportDemo';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/start" element={<CaseStart />} />
      <Route path="/cases" element={<Cases />} />
      <Route path="/appointments/watch" element={<AppointmentWatchPage />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/vault" element={<IdentityVault />} />
      <Route path="/digital-vault" element={<DigitalVault />} />
      <Route path="/demo/passport" element={<PassportDemo />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App