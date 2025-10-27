import React, { createContext, useContext, useEffect, useState } from "react";

type User = { username?: string; [key: string]: any } | null;

type AuthContextType = {
  user: User;
  token: string | null;
  login: (creds: { username: string; password: string }) => Promise<void>;
  signup: (creds: { username: string; password: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<User>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {}
  }, [token]);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(USER_KEY);
    } catch {}
  }, [user]);

  async function login(creds: { username: string; password: string }) {
    // Try the standard simplejwt token endpoint first (/api/auth/token/)
    // Backend may also provide a custom /api/auth/login/ endpoint; prefer token endpoint.
    // Try a few common endpoints/backends so sign-in works with typical Django setups.
    const endpoints = [
      "/api/auth/token/", // djangorestframework-simplejwt
      "/api/auth/login/", // custom login
      "/api/auth/token/obtain/",
    ];

    let lastError: string | null = null;
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(creds),
        });

        if (!res.ok) {
          // if 404 try next endpoint
          if (res.status === 404) {
            lastError = `Not found: ${endpoint}`;
            continue;
          }

          // try to parse JSON error bodies
          try {
            const j = await res.json();
            // common error shapes: { detail: 'msg' } or { non_field_errors: [...] }
            if (j.detail) lastError = String(j.detail);
            else if (j.non_field_errors)
              lastError = JSON.stringify(j.non_field_errors);
            else lastError = JSON.stringify(j);
          } catch {
            try {
              const t = await res.text();
              if (t) lastError = t;
            } catch {}
          }
          continue;
        }

        const data = await res.json();
        // Accept common token fields
        const t = data.access ?? data.token ?? data.auth_token ?? null;
        const u =
          data.user ?? (data.username ? { username: data.username } : null);
        setToken(t);
        // If backend didn't return a user, use the submitted username so UI reflects signed-in state
        setUser(u ?? { username: creds.username });
        return;
      } catch (err: any) {
        lastError = err?.message ?? String(err);
      }
    }

    throw new Error(lastError ?? "Login failed");
  }

  async function signup(creds: { username: string; password: string }) {
    const endpoints = ["/api/auth/signup/", "/api/auth/register/"];
    let lastError: string | null = null;
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(creds),
        });
        if (!res.ok) {
          if (res.status === 404) {
            lastError = `Not found: ${endpoint}`;
            continue;
          }
          try {
            const j = await res.json();
            if (j.detail) lastError = String(j.detail);
            else lastError = JSON.stringify(j);
          } catch {
            const t = await res.text();
            lastError = t || `HTTP ${res.status}`;
          }
          continue;
        }
        const data = await res.json();
        const t = data.access ?? data.token ?? data.auth_token ?? null;
        const u =
          data.user ?? (data.username ? { username: data.username } : null);
        setToken(t);
        setUser(u ?? { username: creds.username });
        return;
      } catch (err: any) {
        lastError = err?.message ?? String(err);
      }
    }
    throw new Error(lastError ?? "Signup failed");
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;
