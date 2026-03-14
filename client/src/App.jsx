import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthScreen } from './pages/AuthScreen';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Exercises } from './pages/Exercises';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { SetupScreen } from './pages/SetupScreen';
import './app.css';

function AuthOrRedirect() {
  const { currentUser } = useApp();
  if (currentUser) return <Navigate to="/" replace />;
  return <AuthScreen />;
}

function ProtectedRoute({ children }) {
  const { currentUser, S } = useApp();
  if (!currentUser) return <Navigate to="/auth" replace />;
  if (!S.profile) return <SetupScreen />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthOrRedirect />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="exercises" element={<Exercises />} />
        <Route path="programs" element={<PlaceholderPage title="Programs" subtitle="Pre-built workout splits" />} />
        <Route path="progress" element={<PlaceholderPage title="Progress" subtitle="Track volume and achievements" />} />
        <Route path="timer" element={<PlaceholderPage title="Rest Timer" subtitle="Rest between sets" />} />
        <Route path="community" element={<PlaceholderPage title="Community" subtitle="Chat and share" />} />
        <Route path="coach" element={<PlaceholderPage title="AI Coach" subtitle="Workout recommendations" />} />
        <Route path="profile" element={<PlaceholderPage title="Profile" subtitle="Your stats and settings" />} />
        <Route path="settings" element={<PlaceholderPage title="Settings" subtitle="Customize your experience" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
