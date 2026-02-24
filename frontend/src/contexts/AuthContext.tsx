import { createContext, useContext, useState } from "react";
import type { User } from "@/types";

interface AuthContextValue {
  currentUser: User;
  updateUser: (updates: Partial<User>) => void;
  csrfToken: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  user: User;
  csrfToken: string;
  children: React.ReactNode;
}

export function AuthProvider({ user, csrfToken, children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User>(user);

  function updateUser(updates: Partial<User>) {
    setCurrentUser((prev) => ({ ...prev, ...updates }));
  }

  return (
    <AuthContext.Provider value={{ currentUser, updateUser, csrfToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
