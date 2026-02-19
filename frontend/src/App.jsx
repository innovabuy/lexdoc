import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { ExtranetAuthProvider, ExtranetAuthContext } from './contexts/ExtranetAuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useContext, lazy, Suspense } from 'react';
import Login from './pages/Login';
import MainLayout from './components/layout/MainLayout';
import ExtranetLayout from './components/layout/ExtranetLayout';
import Dashboard from './pages/Dashboard';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';

// Lazy-loaded pages (code-splitting)
const OnboardingWizard = lazy(() => import('./pages/OnboardingWizard'));
const Folders = lazy(() => import('./pages/Folders'));
const ClientsPage = lazy(() => import('./pages/clients/ClientsPage'));
const ClientDetailPage = lazy(() => import('./pages/clients/ClientDetailPage'));
const FolderDetail = lazy(() => import('./pages/FolderDetail'));
const FolderDetailPage = lazy(() => import('./pages/folders/FolderDetailPage'));
const FolderCreateWizard = lazy(() => import('./pages/folders/FolderCreateWizard'));
const CabinetSettings = lazy(() => import('./pages/parametres/CabinetSettings'));
const TemplatesSettings = lazy(() => import('./pages/parametres/TemplatesSettings'));
const ArborescencesSettings = lazy(() => import('./pages/parametres/ArborescencesSettings'));
const IntegrationsSettings = lazy(() => import('./pages/parametres/IntegrationsSettings'));
const UtilisateursSettings = lazy(() => import('./pages/parametres/UtilisateursSettings'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Chat = lazy(() => import('./pages/Chat'));
const Signatures = lazy(() => import('./pages/Signatures'));
const Tracking = lazy(() => import('./pages/Tracking'));
const DocumentRequestsPage = lazy(() => import('./pages/DocumentRequests'));
const DocumentsTreePage = lazy(() => import('./pages/documents/DocumentsTreePage'));
const DocumentsGlobal = lazy(() => import('./pages/documents/DocumentsGlobal'));
const LegalInfo = lazy(() => import('./pages/settings/LegalInfo'));
const ClientAccess = lazy(() => import('./pages/settings/ClientAccess'));
const Backups = lazy(() => import('./pages/settings/Backups'));
const FolderCategories = lazy(() => import('./pages/settings/FolderCategories'));
const TemplateCategories = lazy(() => import('./pages/settings/TemplateCategories'));
const NotificationSettings = lazy(() => import('./pages/settings/NotificationSettings'));
const AbonnementSettings = lazy(() => import('./pages/parametres/AbonnementSettings'));

// Extranet pages
const ExtranetLogin = lazy(() => import('./pages/extranet/ExtranetLogin'));
const ExtranetActivate = lazy(() => import('./pages/extranet/ExtranetActivate'));
const ExtranetDashboard = lazy(() => import('./pages/extranet/ExtranetDashboard'));
const ExtranetProfileWizard = lazy(() => import('./pages/extranet/ExtranetProfileWizard'));
const ExtranetFolderView = lazy(() => import('./pages/extranet/ExtranetFolderView'));
const ExtranetFormPage = lazy(() => import('./pages/extranet/ExtranetFormPage'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="fdp-spinner" />
    </div>
  );
}

function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  return user ? children : <Navigate to="/login" />;
}

function OnboardingGuard({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  return user ? <Navigate to="/dashboard" /> : children;
}

function ExtranetPrivateRoute({ children }) {
  const { isAuthenticated, loading } = useContext(ExtranetAuthContext);
  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  return isAuthenticated ? children : <Navigate to="/extranet/login" />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ExtranetAuthProvider>
          <BrowserRouter>
            <OfflineIndicator />
            <PWAInstallPrompt />
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

              {/* Onboarding — full screen, no sidebar */}
              <Route path="/onboarding" element={<PrivateRoute><OnboardingWizard /></PrivateRoute>} />

              {/* Protected routes with sidebar layout + onboarding guard */}
              <Route element={<OnboardingGuard><MainLayout /></OnboardingGuard>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="clients/:id" element={<ClientDetailPage />} />
                <Route path="dossiers" element={<Folders />} />
                <Route path="dossiers/nouveau" element={<FolderCreateWizard />} />
                <Route path="dossiers/:id" element={<FolderDetailPage />} />

                {/* Parametres */}
                <Route path="parametres/cabinet" element={<CabinetSettings />} />
                <Route path="parametres/templates" element={<TemplatesSettings />} />
                <Route path="parametres/arborescences" element={<ArborescencesSettings />} />
                <Route path="parametres/integrations" element={<IntegrationsSettings />} />
                <Route path="parametres/utilisateurs" element={<UtilisateursSettings />} />
                <Route path="parametres/abonnement" element={<AbonnementSettings />} />

                {/* Legacy routes kept for backward compatibility (no sidebar nav item) */}
                <Route path="folders" element={<Navigate to="/dossiers" replace />} />
                <Route path="folders/:id" element={<FolderDetail />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="statistics" element={<Statistics />} />
                <Route path="chat" element={<Chat />} />
                <Route path="signatures" element={<Signatures />} />
                <Route path="tracking" element={<Tracking />} />
                <Route path="document-requests" element={<DocumentRequestsPage />} />
                <Route path="documents/all" element={<DocumentsGlobal />} />
                <Route path="documents/tree" element={<DocumentsTreePage />} />
                <Route path="settings/legal-info" element={<LegalInfo />} />
                <Route path="settings/client-access" element={<ClientAccess />} />
                <Route path="settings/backups" element={<Backups />} />
                <Route path="settings/folder-categories" element={<FolderCategories />} />
                <Route path="settings/template-categories" element={<TemplateCategories />} />
                <Route path="settings/notifications" element={<NotificationSettings />} />
              </Route>

              {/* ============================================ */}
              {/* EXTRANET CLIENT ROUTES                       */}
              {/* ============================================ */}
              <Route path="/extranet/login" element={<ExtranetLogin />} />
              <Route path="/extranet/activate/:token" element={<ExtranetActivate />} />
              <Route path="/extranet/form/:token" element={<ExtranetFormPage />} />

              {/* Protected extranet routes with ExtranetLayout */}
              <Route element={<ExtranetPrivateRoute><ExtranetLayout /></ExtranetPrivateRoute>}>
                <Route path="/extranet/dashboard" element={<ExtranetDashboard />} />
                <Route path="/extranet/profile" element={<ExtranetProfileWizard />} />
                <Route path="/extranet/folders/:folderId" element={<ExtranetFolderView />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
          </ExtranetAuthProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
    </QueryClientProvider>
  );
}
