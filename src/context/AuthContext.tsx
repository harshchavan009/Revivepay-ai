import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { authService } from "../services";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
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
    const saved = localStorage.getItem("revivepay_user");
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

  useEffect(() => {
    if (!user) {
      setUser(DEMO_PERSONAS.REVENUE_OPERATOR);
    }
  }, []);

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
        localStorage.setItem("revivepay_user", JSON.stringify(found));
      } else {
        const fallback: User = {
          id: "usr_custom",
          name: email.split("@")[0],
          email,
          role: "REVENUE_OPERATOR",
          is_active: true
        };
        setUser(fallback);
        localStorage.setItem("revivepay_user", JSON.stringify(fallback));
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
      localStorage.setItem("revivepay_user", JSON.stringify(fallback));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const switchPersona = (role: UserRole) => {
    const persona = DEMO_PERSONAS[role];
    setUser(persona);
    localStorage.setItem("revivepay_user", JSON.stringify(persona));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
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
