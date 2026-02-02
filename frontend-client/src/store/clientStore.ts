import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Client {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
}

interface ClientStore {
  token: string | null;
  client: Client | null;
  isAuthenticated: boolean;
  setAuth: (token: string, client: Client) => void;
  logout: () => void;
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set) => ({
      token: null,
      client: null,
      isAuthenticated: false,
      setAuth: (token, client) =>
        set({
          token,
          client,
          isAuthenticated: true,
        }),
      logout: () => {
        localStorage.removeItem('client_token');
        set({
          token: null,
          client: null,
          isAuthenticated: false,
        });
        window.location.href = '/login';
      },
    }),
    {
      name: 'client-auth',
      partialize: (state) => ({
        token: state.token,
        client: state.client,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useClientStore;
