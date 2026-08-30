import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { authService } from "../services";
import { safeStorage } from "../utils/storage";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  demoLogin: (persona: "merchant_owner" | "revenue_operator" | "support_operator" | "admin") => Promise<void>;
  register: (name: string, email: string, pass: string, role: string) => Promise<void>;
  logout: () => void;
  switchPersona: (role: UserRole) => void;
}

const DEMO_PERSONAS: Record<UserRole, User> = {
  MERCHANT_OWNER: {
    id: "user_owner",
    name: "Aditya Sengupta",
    email: "owner@revivepay.ai",
    role: "MERCHANT_OWNER",
    is_active: true,
  },
  REVENUE_OPERATOR: {
    id: "user_operator",
    name: "Rohan Deshmukh",
    email: "operator@revivepay.ai",
    role: "REVENUE_OPERATOR",
    is_active: true,
  },
  SUPPORT_OPERATOR: {
    id: "user_support",
    name: "Sneha Kulkarni",
    email: "support@revivepay.ai",
    role: "SUPPORT_OPERATOR",
    is_active: true,
  },
  ADMIN: {
    id: "user_admin",
    name: "Harsh Chavan",
    email: "admin@revivepay.ai",
    role: "ADMIN",
    is_active: true,
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = safeStorage.getItem("revivepay_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEMO_PERSONAS.REVENUE_OPERATOR;
      }
    }
    return DEMO_PERSONAS.REVENUE_OPERATOR; // Default demo persona
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const demoLogin = async (persona: "merchant_owner" | "revenue_operator" | "support_operator" | "admin") => {
    setIsLoading(true);
    try {
      const res = await authService.demoLogin(persona);
      setUser(res.user);
      safeStorage.setItem("revivepay_user", JSON.stringify(res.user));
    } catch {
      const roleMap: Record<string, UserRole> = {
        merchant_owner: "MERCHANT_OWNER",
        revenue_operator: "REVENUE_OPERATOR",
        support_operator: "SUPPORT_OPERATOR",
        admin: "ADMIN"
      };
      const fallbackUser = DEMO_PERSONAS[roleMap[persona] || "REVENUE_OPERATOR"];
      setUser(fallbackUser);
      safeStorage.setItem("revivepay_user", JSON.stringify(fallbackUser));
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login(email, pass);
      setUser(res.user);
    } catch {
      // If offline, match demo persona
      const found = Object.values(DEMO_PERSONAS).find(p => p.email === email);
      if (found) {
        setUser(found);
        safeStorage.setItem("revivepay_user", JSON.stringify(found));
      } else {
        const fallback: User = {
          id: "usr_custom",
          name: email.split("@")[0],
          email,
          role: "REVENUE_OPERATOR",
          is_active: true
        };
        setUser(fallback);
        safeStorage.setItem("revivepay_user", JSON.stringify(fallback));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string, role: string) => {
    setIsLoading(true);
    try {
      const newUser = await authService.register(name, email, pass, role);
      await login(email, pass);
    } catch {
      const fallback: User = {
        id: "usr_reg",
        name,
        email,
        role: role as UserRole,
        is_active: true
      };
      setUser(fallback);
      safeStorage.setItem("revivepay_user", JSON.stringify(fallback));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    safeStorage.removeItem("revivepay_user");
    safeStorage.removeItem("auth_token");
    safeStorage.removeItem("revivepay_token");
    setUser(null);
  };

  const switchPersona = async (role: UserRole) => {
    const persona = DEMO_PERSONAS[role];
    try {
      const res = await authService.switchPersona(role, persona?.email);
      setUser(res.user);
      safeStorage.setItem("revivepay_user", JSON.stringify(res.user));
    } catch {
      setUser(persona);
      safeStorage.setItem("revivepay_user", JSON.stringify(persona));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        demoLogin,
        register,
        logout,
        switchPersona
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
