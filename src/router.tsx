import { createRootRoute, createRoute, createRouter, RouterProvider, Outlet } from '@tanstack/react-router';
import { createTheme, ThemeProvider, CssBaseline, Box } from '@mui/material';
import { useAuthStore } from './store/authStore';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import Inventory from './components/inventory/Inventory';
import { Warehouse } from './components/warehouse';
import Navbar from './components/layout/Navbar';
import LowStockAlert from './components/layout/LowStockAlert';
import { Navigate } from '@tanstack/react-router';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#007AFF', // iOS Blue
      light: '#5AC8FA',
      dark: '#0051D5',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#5856D6', // iOS Purple
      light: '#AF52DE',
      dark: '#3634A3',
    },
    info: {
      main: '#5AC8FA', // iOS Light Blue
      light: '#8ED8F8',
      dark: '#0A84FF',
      // @ts-ignore
      lighter: '#E5F6FD',
    },
    success: {
      main: '#34C759', // iOS Green
      light: '#30D158',
      dark: '#248A3D',
      // @ts-ignore
      lighter: '#E8F8EC',
    },
    warning: {
      main: '#FF9500', // iOS Orange
      light: '#FFAC33',
      dark: '#C77700',
      // @ts-ignore
      lighter: '#FFF4E5',
    },
    error: {
      main: '#FF3B30', // iOS Red
      light: '#FF6259',
      dark: '#D70015',
      // @ts-ignore
      lighter: '#FFEBEA',
    },
    background: {
      default: '#F2F2F7', // iOS Light Background
      paper: '#FFFFFF',
    },
    text: {
      primary: '#000000',
      secondary: '#3C3C43',
      disabled: '#999999',
    },
    divider: '#E5E5EA',
    grey: {
      50: '#FAFAFA',
      100: '#F5F5F7',
      200: '#E5E5EA',
      300: '#D1D1D6',
      400: '#C7C7CC',
      500: '#AEAEB2',
      600: '#8E8E93',
      700: '#636366',
      800: '#48484A',
      900: '#1C1C1E',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.35,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.005em',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      letterSpacing: '0em',
      lineHeight: 1.45,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      letterSpacing: '0em',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
      letterSpacing: '0.01em',
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      letterSpacing: '0.03em',
    },
  },
  shape: {
    borderRadius: 12, // iOS-style rounded corners
  },
  shadows: [
    'none',
    '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
    '0 2px 4px rgba(0, 0, 0, 0.04), 0 3px 6px rgba(0, 0, 0, 0.06)',
    '0 3px 6px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.06)',
    '0 4px 8px rgba(0, 0, 0, 0.04), 0 6px 12px rgba(0, 0, 0, 0.06)',
    '0 6px 12px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(0, 0, 0, 0.06)',
    '0 8px 16px rgba(0, 0, 0, 0.04), 0 10px 20px rgba(0, 0, 0, 0.06)',
    '0 10px 20px rgba(0, 0, 0, 0.04), 0 12px 24px rgba(0, 0, 0, 0.06)',
    '0 12px 24px rgba(0, 0, 0, 0.04), 0 14px 28px rgba(0, 0, 0, 0.06)',
    '0 14px 28px rgba(0, 0, 0, 0.04), 0 16px 32px rgba(0, 0, 0, 0.06)',
    '0 16px 32px rgba(0, 0, 0, 0.04), 0 18px 36px rgba(0, 0, 0, 0.06)',
    '0 18px 36px rgba(0, 0, 0, 0.04), 0 20px 40px rgba(0, 0, 0, 0.06)',
    '0 20px 40px rgba(0, 0, 0, 0.04), 0 22px 44px rgba(0, 0, 0, 0.06)',
    '0 22px 44px rgba(0, 0, 0, 0.04), 0 24px 48px rgba(0, 0, 0, 0.06)',
    '0 24px 48px rgba(0, 0, 0, 0.04), 0 26px 52px rgba(0, 0, 0, 0.06)',
    '0 26px 52px rgba(0, 0, 0, 0.04), 0 28px 56px rgba(0, 0, 0, 0.06)',
    '0 28px 56px rgba(0, 0, 0, 0.04), 0 30px 60px rgba(0, 0, 0, 0.06)',
    '0 30px 60px rgba(0, 0, 0, 0.04), 0 32px 64px rgba(0, 0, 0, 0.06)',
    '0 32px 64px rgba(0, 0, 0, 0.04), 0 34px 68px rgba(0, 0, 0, 0.06)',
    '0 34px 68px rgba(0, 0, 0, 0.04), 0 36px 72px rgba(0, 0, 0, 0.06)',
    '0 36px 72px rgba(0, 0, 0, 0.04), 0 38px 76px rgba(0, 0, 0, 0.06)',
    '0 38px 76px rgba(0, 0, 0, 0.04), 0 40px 80px rgba(0, 0, 0, 0.06)',
    '0 40px 80px rgba(0, 0, 0, 0.04), 0 42px 84px rgba(0, 0, 0, 0.06)',
    '0 42px 84px rgba(0, 0, 0, 0.04), 0 44px 88px rgba(0, 0, 0, 0.06)',
    '0 44px 88px rgba(0, 0, 0, 0.04), 0 46px 92px rgba(0, 0, 0, 0.06)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          padding: '10px 20px',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0, 122, 255, 0.15)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#007AFF',
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
              },
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#E5E5EA',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#F2F2F7',
        },
      },
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        Loading...
      </div>
    );
  }

  // Check localStorage directly as a fallback
  const token = localStorage.getItem('auth_token');
  const hasValidSession = isAuthenticated || !!token;

  return hasValidSession ? <>{children}</> : <Navigate to="/login" />;
};

const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Don't check isLoading here - let the login/register components handle their own loading states
  // This prevents the page from blinking when login fails
  return <>{children}</>;
};

// Super Admin only route - restricts access to SUPER_ADMIN role
const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        Loading...
      </div>
    );
  }

  // Check localStorage directly as a fallback
  const token = localStorage.getItem('auth_token');
  const hasValidSession = isAuthenticated || !!token;

  if (!hasValidSession) {
    return <Navigate to="/login" />;
  }

  // Check if user is SUPER_ADMIN (normalize to uppercase)
  const normalizedRole = user?.role?.toUpperCase();
  if (normalizedRole !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

// Root route
const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Outlet />
      </Box>
    </ThemeProvider>
  ),
});

// Layout route that includes Navbar and LowStockAlert for authenticated routes
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    return (
      <>
        {isAuthenticated && <Navbar />}
        {isAuthenticated && <LowStockAlert />}
        <Outlet />
      </>
    );
  },
});

// Index route (redirect based on auth)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />;
  },
});

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => (
    <AuthRoute>
      <Login />
    </AuthRoute>
  ),
});

// Register route
const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: () => (
    <AuthRoute>
      <Register />
    </AuthRoute>
  ),
});

// Dashboard route
const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/dashboard',
  component: () => (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  ),
});

// Inventory route
const inventoryRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/inventory',
  component: () => (
    <ProtectedRoute>
      <Inventory />
    </ProtectedRoute>
  ),
});

// Warehouse route (Super Admin only)
const warehouseRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/warehouses',
  component: () => (
    <SuperAdminRoute>
      <Warehouse />
    </SuperAdminRoute>
  ),
});

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([dashboardRoute, inventoryRoute, warehouseRoute]),
  indexRoute,
  loginRoute,
  registerRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export { router };