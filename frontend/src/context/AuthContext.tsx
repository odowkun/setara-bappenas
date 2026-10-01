"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Role } from "@/types/auth";
import {
  API_BASE_URL,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  authenticatedFetch,
} from "@/lib/apiClient";
import DashboardLoadingScreen from "@/components/ui/DashboardLoadingScreen";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    cfTurnstileToken?: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  hasRole: (roles: Role[]) => boolean;
  hasPermission: (permission: string) => boolean;
  updateProfile: (updatedData: Partial<User>) => Promise<boolean>;
  changePassword: (
    currentPassword: string,
    password: string,
    passwordConfirmation: string
  ) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface LoginResponse {
  data: {
    token: string;
    user: User;
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        localStorage.removeItem(AUTH_USER_KEY);
        setLoading(false);
        return;
      }

      const startTime = Date.now();
      const minLoadingDuration = 1350; // Enforce calibrated UX duration so 0-100% progress finishes smoothly

      try {
        const response = await authenticatedFetch("/auth/me", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Session validation failed: ${response.status}`);
        }

        const result = (await response.json()) as { data: User };
        setUser(result.data);

        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, minLoadingDuration - elapsed);
        if (remainingDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingDelay));
        }
        setLoading(false);
      } catch {
        setUser(null);
        localStorage.removeItem(AUTH_USER_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setSessionError("Sesi kredensial tidak valid atau telah berakhir.");
        // Give 950ms so user clearly perceives the rejection state before unmounting
        await new Promise((resolve) => setTimeout(resolve, 950));
        setLoading(false);
      }
    };

    validateSession();
  }, []);

  const login = async (
    email: string,
    password: string,
    cfTurnstileToken?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const payload: Record<string, string> = { email, password };
      if (cfTurnstileToken) {
        payload.cf_turnstile_token = cfTurnstileToken;
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          success: false,
          message:
            result?.message ||
            "Email atau kata sandi tidak terdaftar di direktori akun.",
        };
      }

      setUser(result.data.user);
      localStorage.setItem(AUTH_TOKEN_KEY, result.data.token);
      return { success: true };
    } catch {
      return {
        success: false,
        message:
          "Gangguan koneksi ke server autentikasi. Silakan periksa jaringan Anda.",
      };
    }
  };

  const logout = () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => undefined);
    }
    setUser(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  };

  const updateProfile = async (updatedData: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await authenticatedFetch("/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) return false;

      const result = (await response.json()) as { data: User };
      setUser(result.data);
      return true;
    } catch {
      return false;
    }
  };

  const changePassword = async (
    currentPassword: string,
    password: string,
    passwordConfirmation: string
  ): Promise<boolean> => {
    try {
      const response = await authenticatedFetch("/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  };

  const hasRole = (allowedRoles: Role[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.role === "superadmin" || Boolean(user.permissions?.includes(permission));
  };

  if (loading) {
    return (
      <DashboardLoadingScreen
        title="Memuat Sesi Dashboard BAPPEDA"
        statusText="Memverifikasi hak akses portal..."
        error={sessionError}
      />
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
        hasPermission,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
