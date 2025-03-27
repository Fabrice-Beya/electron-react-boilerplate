import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/theme';
import WelcomePage from './pages/WelcomePage';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import AuthLayout from './pages/auth/_layout';
import LoginPage from './pages/auth/login';
import RegisterPage from './pages/auth/register';
import EntriesPage from './pages/entries';
import CreateEntryPage from './pages/entries/create';
import ViewEntryPage from './pages/entries/[id]';
import EditEntryPage from './pages/entries/edit/[id]';
import ChatPage from './pages/chat';
import SettingsPage from './pages/settings';
import AccountSettingsPage from './pages/settings/account';
import ProfileSettingsPage from './pages/settings/account/profile';
import ChangeEmailPage from './pages/settings/account/email';
import ChangePasswordPage from './pages/settings/account/password';
import PreferencesPage from './pages/settings/preferences';
import MainLayout from './components/Layout/MainLayout';
import { ServiceFactory } from '../services/ServiceFactory';
import { withAuth } from './context/withAuth';
import EditTranscriptPage from './pages/entries/edit-transcript';
import AIScreen from './pages/ai';
import EntryAIScreen from './pages/entries/ai/[id]';
import EnvInitializer from './components/EnvInitializer';

// Wrap components that require authentication
const ProtectedEntriesPage = withAuth(EntriesPage);
const ProtectedCreateEntryPage = withAuth(CreateEntryPage);
const ProtectedViewEntryPage = withAuth(ViewEntryPage);
const ProtectedEditEntryPage = withAuth(EditEntryPage);
const ProtectedChatPage = withAuth(ChatPage);
const ProtectedSettingsPage = withAuth(SettingsPage);
const ProtectedAccountSettingsPage = withAuth(AccountSettingsPage);
const ProtectedProfileSettingsPage = withAuth(ProfileSettingsPage);
const ProtectedChangeEmailPage = withAuth(ChangeEmailPage);
const ProtectedChangePasswordPage = withAuth(ChangePasswordPage);
const ProtectedEditTranscriptPage = withAuth(EditTranscriptPage);
const ProtectedAIScreen = withAuth(AIScreen);
const ProtectedEntryAIScreen = withAuth(EntryAIScreen);
const ProtectedPreferencesPage = withAuth(PreferencesPage);

export default function App() {
  // Force dark mode and initialize services
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <EnvInitializer>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/auth" element={<AuthLayout />}>
                <Route index element={<LoginPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
              </Route>
              <Route
                path="/entries"
                element={
                  <MainLayout>
                    <ProtectedEntriesPage />
                  </MainLayout>
                }
              />
              <Route
                path="/entries/create"
                element={
                  <MainLayout>
                    <ProtectedCreateEntryPage />
                  </MainLayout>
                }
              />
              <Route
                path="/entries/:id"
                element={
                  <MainLayout>
                    <ProtectedViewEntryPage />
                  </MainLayout>
                }
              />
              <Route
                path="/entries/edit/:id"
                element={
                  <MainLayout>
                    <ProtectedEditEntryPage />
                  </MainLayout>
                }
              />
              <Route
                path="/chat"
                element={
                  <MainLayout>
                    <ProtectedChatPage />
                  </MainLayout>
                }
              />
              <Route
                path="/settings"
                element={
                  <MainLayout>
                    <ProtectedSettingsPage />
                  </MainLayout>
                }
              />
              <Route
                path="/settings/account"
                element={
                  <MainLayout>
                    <ProtectedAccountSettingsPage />
                  </MainLayout>
                }
              />
              <Route
                path="/settings/account/profile"
                element={
                  <MainLayout>
                    <ProtectedProfileSettingsPage />
                  </MainLayout>
                }
              />
              <Route
                path="/settings/account/email"
                element={
                  <MainLayout>
                    <ProtectedChangeEmailPage />
                  </MainLayout>
                }
              />
              <Route
                path="/settings/account/password"
                element={
                  <MainLayout>
                    <ProtectedChangePasswordPage />
                  </MainLayout>
                }
              />
              <Route
                path="/settings/preferences"
                element={
                  <MainLayout>
                    <ProtectedPreferencesPage />
                  </MainLayout>
                }
              />
              <Route 
                path="/entries/edit-transcript" 
                element={
                  <MainLayout>
                    <ProtectedEditTranscriptPage />
                  </MainLayout>
                } 
              />
              <Route
                path="/ai"
                element={
                  <MainLayout>
                    <ProtectedAIScreen />
                  </MainLayout>
                }
              />
              <Route
                path="/entries/:id/ai"
                element={
                  <MainLayout>
                    <ProtectedEntryAIScreen />
                  </MainLayout>
                }
              />
            </Routes>
          </Router>
        </AuthProvider>
      </EnvInitializer>
    </ThemeProvider>
  );
}
