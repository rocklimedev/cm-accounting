import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { useLoginMutation, useRegisterMutation } from "../api/auth.api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [loginMutation] = useLoginMutation();
  const [registerMutation] = useRegisterMutation();

  // Restore session
  useEffect(() => {
    try {
      const token = localStorage.getItem("erp_token");
      const storedUser = localStorage.getItem("erp_user");

      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        localStorage.removeItem("erp_token");
        localStorage.removeItem("erp_user");
      }
    } catch (error) {
      console.error("Failed to restore session:", error);
      localStorage.removeItem("erp_token");
      localStorage.removeItem("erp_user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login
  const login = useCallback(
    async (email, password) => {
      const { accessToken, user } = await loginMutation({
        email,
        password,
      }).unwrap();

      localStorage.setItem("erp_token", accessToken);
      localStorage.setItem("erp_user", JSON.stringify(user));

      setUser(user);

      return user;
    },
    [loginMutation],
  );

  // Register
  const register = useCallback(
    async (payload) => {
      return await registerMutation(payload).unwrap();
    },
    [registerMutation],
  );

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
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
