import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setExtranetStoreHandlers, type ClientInfo } from '@/lib/api/extranet';

interface ExtranetState {
  token: string | null;
  client: ClientInfo | null;
  isAuthenticated: boolean;
  setAuth: (token: string, client: ClientInfo) => void;
  logout: () => void;
}

export const useExtranetStore = create<ExtranetState>()(
  persist(
    (set) => ({
      token: null,
      client: null,
      isAuthenticated: false,

      setAuth: (token, client) => {
        set({ token, client, isAuthenticated: true });
      },

      logout: () => {
        set({ token: null, client: null, isAuthenticated: false });
      },
    }),
    {
      name: 'extranet-auth',
      partialize: (state) => ({
        token: state.token,
        client: state.client,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize API client handlers after store creation
setExtranetStoreHandlers(
  () => useExtranetStore.getState().token,
  (token, client) => useExtranetStore.getState().setAuth(token, client),
  () => useExtranetStore.getState().logout()
);
