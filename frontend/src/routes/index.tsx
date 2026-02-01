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
