import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const ExtranetAuthContext = createContext(null);

const TOKEN_KEY = 'extranet_token';
const ACCESS_KEY = 'extranet_access';

export function ExtranetAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [access, setAccess] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(ACCESS_KEY));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    if (token) {
      api.get('/extranet/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          const data = res.data?.data || res.data;
          setAccess(data);
          localStorage.setItem(ACCESS_KEY, JSON.stringify(data));
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(ACCESS_KEY);
          setToken(null);
          setAccess(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    const res = await api.post('/extranet/login', { email, password });
    const data = res.data?.data || res.data;
    setToken(data.token);
    setAccess(data.access);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(ACCESS_KEY, JSON.stringify(data.access));
    return data;
  }, []);

  const activate = useCallback(async (activationToken, password) => {
    const res = await api.post('/extranet/activate', { token: activationToken, password });
    const data = res.data?.data || res.data;
    if (data.token) {
      setToken(data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAccess(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACCESS_KEY);
  }, []);

  const authedApi = useCallback((method, url, data) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    if (method === 'get' || method === 'delete') {
      return api[method](url, config);
    }
    return api[method](url, data, config);
  }, [token]);

  return (
    <ExtranetAuthContext.Provider
      value={{
        token,
        access,
        loading,
        isAuthenticated: !!token,
        login,
        activate,
        logout,
        authedApi,
      }}
    >
      {children}
    </ExtranetAuthContext.Provider>
  );
}
