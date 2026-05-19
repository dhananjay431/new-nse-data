import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("nse_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("nse_user");
      }
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    // Demo authentication - accept any credentials
    // In production, this would call a real API
    if (email && password) {
      const userData = {
        email,
        name: email.split("@")[0],
        loginTime: new Date().toISOString(),
      };
      setUser(userData);
      localStorage.setItem("nse_user", JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, error: "Please enter email and password." };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("nse_user");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
