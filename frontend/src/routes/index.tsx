import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingOverlay } from '@/components/ui';
import { AppLayout, AuthLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth';

// Lazy load pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));
const TemplatesPage = lazy(() => import('@/pages/TemplatesPage'));
const DocumentsPage = lazy(() => import('@/pages/documents/DocumentsPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('@/pages/UnauthorizedPage'));

// Signatures
const SignaturesPage = lazy(() => import('@/pages/signatures/SignaturesPage'));
const NewSignaturePage = lazy(() => import('@/pages/signatures/NewSignaturePage'));
const SignatureDetailPage = lazy(() => import('@/pages/signatures/SignatureDetailPage'));

// LRAR
const LrarPage = lazy(() => import('@/pages/lrar/LrarPage'));
const NewLrarPage = lazy(() => import('@/pages/lrar/NewLrarPage'));
const LrarDetailPage = lazy(() => import('@/pages/lrar/LrarDetailPage'));

// Document Builder
const DocumentBuilderPage = lazy(() => import('@/pages/document-builder/DocumentBuilderPage'));
const TemplateEditorPage = lazy(() => import('@/pages/document-builder/TemplateEditorPage'));
const TemplateDetailPage = lazy(() => import('@/pages/document-builder/TemplateDetailPage'));
const GenerateDocumentPage = lazy(() => import('@/pages/document-builder/GenerateDocumentPage'));
const GeneratedDocumentDetailPage = lazy(() => import('@/pages/document-builder/GeneratedDocumentDetailPage'));

// Document Blocks
const DocumentBlocksListPage = lazy(() => import('@/pages/document-blocks/DocumentBlocksListPage'));
const DocumentBlockDetailPage = lazy(() => import('@/pages/document-blocks/DocumentBlockDetailPage'));
const DocumentBlockFormPage = lazy(() => import('@/pages/document-blocks/DocumentBlockFormPage'));

// Document Templates
const DocumentTemplatesListPage = lazy(() => import('@/pages/document-templates/DocumentTemplatesListPage'));
const TemplateBuilderPage = lazy(() => import('@/pages/document-templates/TemplateBuilderPage'));
const DocumentTemplateDetailPage = lazy(() => import('@/pages/document-templates/TemplateDetailPage'));

// Profile
const AvocatLegalInfoPage = lazy(() => import('@/pages/profile/AvocatLegalInfoPage'));

// Admin
const BackupsPage = lazy(() => import('@/pages/admin/BackupsPage'));

// Document Generation
const GeneratedDocumentsListPage = lazy(() => import('@/pages/document-generation/GeneratedDocumentsListPage'));
const DocumentGenerationWizard = lazy(() => import('@/pages/document-generation/DocumentGenerationWizard'));

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        </Route>

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/legal" element={<AvocatLegalInfoPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Admin only routes */}
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cabinet"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/backups"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <BackupsPage />
              </ProtectedRoute>
            }
          />

          {/* Templates */}
          <Route
            path="/templates"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT']}>
                <TemplatesPage />
              </ProtectedRoute>
            }
          />

          {/* GED - Document Management */}
          <Route path="/documents/*" element={<DocumentsPage />} />
          <Route path="/folders" element={<DocumentsPage />} />
          <Route path="/folders/*" element={<DocumentsPage />} />

          {/* Signatures */}
          <Route
            path="/signatures"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT', 'COLLABORATEUR']}>
                <SignaturesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/signatures/new"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT', 'COLLABORATEUR']}>
                <NewSignaturePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/signatures/:id"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT', 'COLLABORATEUR']}>
                <SignatureDetailPage />
              </ProtectedRoute>
            }
          />

          {/* LRAR */}
          <Route
            path="/lrar"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT', 'COLLABORATEUR']}>
                <LrarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lrar/new"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT', 'COLLABORATEUR']}>
                <NewLrarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lrar/:id"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT', 'COLLABORATEUR']}>
                <LrarDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Document Builder */}
          <Route
            path="/document-builder"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT']}>
                <DocumentBuilderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/document-builder/templates/new"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT']}>
                <TemplateEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/document-builder/templates/:templateId"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT']}>
                <TemplateDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/document-builder/templates/:templateId/edit"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT']}>
                <TemplateEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/document-builder/generate/:templateId"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT']}>
                <GenerateDocumentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/document-builder/documents/:documentId"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT']}>
                <GeneratedDocumentDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/document-builder/documents"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT']}>
                <DocumentBuilderPage />
              </ProtectedRoute>
            }
          />

          {/* Document Blocks */}
          <Route
            path="/document-blocks"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT']}>
                <DocumentBlocksListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/document-blocks/new"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT']}>
                <DocumentBlockFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/document-blocks/:id"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT']}>
                <DocumentBlockDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/document-blocks/:id/edit"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT']}>
                <DocumentBlockFormPage />
              </ProtectedRoute>
            }
          />

          {/* Document Templates */}
          <Route
            path="/document-templates"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT']}>
                <DocumentTemplatesListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/document-templates/new"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT']}>
                <TemplateBuilderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/document-templates/:id"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT']}>
                <DocumentTemplateDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/document-templates/:id/edit"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT']}>
                <TemplateBuilderPage />
              </ProtectedRoute>
            }
          />

          {/* Document Generation */}
          <Route
            path="/document-generation"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT', 'COLLABORATEUR']}>
                <GeneratedDocumentsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/document-generation/new"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT', 'COLLABORATEUR']}>
                <DocumentGenerationWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/document-generation/documents/:documentId"
            element={
              <ProtectedRoute roles={['ADMIN', 'AVOCAT', 'COLLABORATEUR']}>
                <DocumentGenerationWizard />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Redirect root to dashboard or login */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Error pages */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
