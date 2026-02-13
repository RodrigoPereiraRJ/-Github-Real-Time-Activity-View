import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/authContext';
import { ThemeProvider } from './services/themeContext';
import { LanguageProvider } from './services/languageContext'; // Added
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Repositories } from './pages/Repositories';
import { Events } from './pages/Events';
import { Settings } from './pages/Settings';
import { Alerts } from './pages/Alerts';
import { Contributors } from './pages/Contributors';
import { Export } from './pages/Export';
import { Connect } from './pages/Connect';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-txt-main">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
    return (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/repositories" element={
            <ProtectedRoute>
              <Repositories />
            </ProtectedRoute>
          } />

          <Route path="/events" element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          } />

          <Route path="/alerts" element={
            <ProtectedRoute>
              <Alerts />
            </ProtectedRoute>
          } />

          <Route path="/contributors" element={
            <ProtectedRoute>
              <Contributors />
            </ProtectedRoute>
          } />

          <Route path="/export" element={
            <ProtectedRoute>
              <Export />
            </ProtectedRoute>
          } />

          <Route path="/connect" element={
            <ProtectedRoute>
              <Connect />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
        </Routes>
    )
}

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default App;