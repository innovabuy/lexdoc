import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ToastProvider } from '../contexts/ToastContext';

// Default mock auth context values
const defaultAuthContext = {
  user: null,
  token: null,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
};

// Custom render function with providers
export function renderWithProviders(
  ui,
  {
    authValue = defaultAuthContext,
    route = '/',
    ...renderOptions
  } = {}
) {
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }) {
    return (
      <ThemeProvider>
        <ToastProvider>
          <AuthContext.Provider value={authValue}>
            <BrowserRouter>{children}</BrowserRouter>
          </AuthContext.Provider>
        </ToastProvider>
      </ThemeProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    authValue,
  };
}

// Mock authenticated user
export const mockAuthenticatedUser = {
  user: {
    id: 'test-user-id',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'ADMIN',
    tenant: {
      id: 'test-tenant-id',
      name: 'Test Cabinet',
    },
  },
  token: 'mock-jwt-token',
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
};

// Mock API response helper
export function mockFetchResponse(data, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
  });
}

// Re-export everything
export * from '@testing-library/react';
