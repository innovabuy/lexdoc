import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import * as authApi from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/utils/error';
import type { User } from '@/lib/types';

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, setAuth, setUser, logout: storeLogout } = useAuthStore();

  // Get profile query
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Sync user data when profile is fetched
  React.useEffect(() => {
    if (profileQuery.data) {
      setUser(profileQuery.data);
    }
  }, [profileQuery.data, setUser]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (result) => {
      if ('requiresTwoFactor' in result) {
        return result;
      }
      setAuth(result.user, result.accessToken, result.refreshToken);
      toast.success(`Bienvenue ${result.user.firstName} !`);
      navigate('/dashboard');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur de connexion'));
    },
  });

  // Login with 2FA mutation
  const login2FAMutation = useMutation({
    mutationFn: ({
      email,
      password,
      code,
    }: {
      email: string;
      password: string;
      code: string;
    }) => authApi.loginWith2FA(email, password, code),
    onSuccess: (result) => {
      setAuth(result.user, result.accessToken, result.refreshToken);
      toast.success(`Bienvenue ${result.user.firstName} !`);
      navigate('/dashboard');
    },
    onError: () => {
      toast.error('Code 2FA invalide');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success('Cabinet créé ! Connectez-vous pour continuer.');
      navigate('/login');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Erreur lors de l'inscription"));
    },
  });

  // Logout
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors during logout
    } finally {
      storeLogout();
      queryClient.clear();
      navigate('/login');
      toast.success('Déconnexion réussie');
    }
  }, [storeLogout, queryClient, navigate]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      setUser(data);
      queryClient.setQueryData(['profile'], data);
      toast.success('Profil mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du profil');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => authApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success('Mot de passe modifié');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Erreur lors du changement de mot de passe'));
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading: profileQuery.isLoading,
    login: loginMutation.mutateAsync,
    loginWith2FA: login2FAMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    updateProfile: updateProfileMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    isLoginLoading: loginMutation.isPending,
    isLogin2FALoading: login2FAMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isUpdateProfileLoading: updateProfileMutation.isPending,
    isChangePasswordLoading: changePasswordMutation.isPending,
  };
}

export function useProfile() {
  const { isAuthenticated } = useAuthStore();

  return useQuery<User>({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
