"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Role } from "@/types/auth";
import { adminService } from "@/services/adminService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (roles: Role[]) => boolean;
  hasPermission: (permission: string) => boolean;
  updateProfile: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "bappeda_auth_user";
const TOKEN_STORAGE_KEY = "bappeda_sanctum_token";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

interface LoginResponse {
  data: {
    token: string;
    user: User;
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored user session", e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) return false;

      const result = (await response.json()) as LoginResponse;
      setUser(result.data.user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result.data.user));
      localStorage.setItem(TOKEN_STORAGE_KEY, result.data.token);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => undefined);
    }
    if (user) {
      adminService.addLog(user.name, user.role, "LOGOUT", "Keluar dari sesi dashboard");
    }
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const updateProfile = (updatedData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    adminService.updateUser(user.id, updatedData);
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-700">Memuat Sesi Dashboard SPBE BAPPEDA...</span>
        </div>
      </div>
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
