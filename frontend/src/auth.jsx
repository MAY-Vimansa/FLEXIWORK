import { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from './api';

// Decode the role/uid from a JWT payload without verifying (server is the source of truth).
function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { userId: payload.uid, email: payload.sub, role: payload.role, exp: payload.exp };
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const t = tokenStore.get();
    if (!t) return null;
    const claims = decodeToken(t);
    if (!claims || (claims.exp && claims.exp * 1000 < Date.now())) {
      tokenStore.clear();
      return null;
    }
    return claims;
  });

  const [suspended, setSuspended] = useState(false);

  // Refresh full user details (incl. company suspension state) from the server on mount.
  useEffect(() => {
    if (user) {
      api.get('/api/auth/me')
        .then((me) => setSuspended(!!me.companySuspended))
        .catch(() => {});
    }
  }, []); // eslint-disable-line

  async function login(identifier, password, remember = true) {
    const res = await api.post('/api/auth/login', { identifier, password });
    tokenStore.set(res.token, remember);
    setUser({ userId: res.userId, email: res.email, role: res.role });
    api.get('/api/auth/me').then((me) => setSuspended(!!me.companySuspended)).catch(() => {});
    return res;
  }

  function logout() {
    tokenStore.clear();
    setUser(null);
    setSuspended(false);
  }

  return (
    <AuthContext.Provider value={{ user, suspended, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
