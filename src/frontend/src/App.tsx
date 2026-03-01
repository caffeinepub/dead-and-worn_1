import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { createContext, useContext, useEffect, useState } from "react";
import { getAdminSession, setAdminSession } from "./hooks/useQueries";
import AdminPage from "./pages/AdminPage";
import HomePage from "./pages/HomePage";
import ListingPage from "./pages/ListingPage";
import LoginPage from "./pages/LoginPage";

// ============================================================
// Auth Context
// ============================================================

interface AuthContextType {
  isAdmin: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  login: () => false,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(() => getAdminSession());

  const login = (username: string, password: string): boolean => {
    if (username === "slimkid3" && password === "AliceInChains92") {
      setIsAdmin(true);
      setAdminSession(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    setAdminSession(false);
  };

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// Protected Route Wrapper
// ============================================================

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate({ to: "/login" });
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;
  return <>{children}</>;
}

// ============================================================
// Layout
// ============================================================

function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "oklch(0.12 0.008 200)",
            border: "1px solid oklch(0.82 0.22 140 / 0.3)",
            color: "oklch(0.92 0.02 120)",
            fontFamily: '"Cabinet Grotesk", sans-serif',
            borderRadius: "0",
          },
        }}
      />
    </AuthProvider>
  );
}

// ============================================================
// Router
// ============================================================

const rootRoute = createRootRoute({ component: RootLayout });

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const listingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/listing/$id",
  component: ListingPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <AdminGuard>
      <AdminPage />
    </AdminGuard>
  ),
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  listingRoute,
  loginRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ============================================================
// App
// ============================================================

export default function App() {
  return <RouterProvider router={router} />;
}
