import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "../../store/authStore";
import WarehouseSelectionModal from "../warehouse/WarehouseSelectionModal";

import {
  Box,
  Typography,
  Paper,
  Alert,
  Link as MuiLink,
  Stack,
  Button,
  TextField,
  Collapse,
  CircularProgress,
  Grid,
} from "@mui/material";
import {
  ErrorOutline as ErrorIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const setUserWarehouse = useAuthStore((state) => state.setUserWarehouse);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearErrors(); // Clear any previous errors

      await login({ email: data.email, password: data.password });

      // Show success animation
      setShowSuccess(true);

      // Check if user is SUPER_ADMIN after login
      const loggedInUser = useAuthStore.getState().user;
      const normalizedRole = loggedInUser?.role?.toUpperCase();

      if (normalizedRole === "SUPER_ADMIN") {
        // SUPER_ADMIN goes directly to dashboard
        setTimeout(() => {
          navigate({ to: "/dashboard", replace: true });
        }, 800);
      } else {
        // Regular users (warehouse, admin, user) select warehouse
        setTimeout(() => {
          setShowSuccess(false);
          setShowWarehouseModal(true);
        }, 1000);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError("root", { message: errorMessage });
    }
  };

  const handleWarehouseSelect = (warehouseId: string) => {
    console.log('[Login] Warehouse selected:', warehouseId);
    setUserWarehouse(warehouseId);
    console.log('[Login] User after warehouse selection:', useAuthStore.getState().user);
    setShowWarehouseModal(false);

    // Small delay to ensure state is updated before navigation
    setTimeout(() => {
      navigate({ to: "/dashboard", replace: true });
    }, 100);
  };

  const handleBackToLogin = async () => {
    setShowWarehouseModal(false);
    await logout();
  };

  return (
    <Box>
      <Grid container sx={{ minHeight: "100vh" }}>
        {/* LEFT SIDEBAR (Video background + text) */}
        <Grid
          size={{ xs: 12, md: 5.2, xl: 7.2 }}
          sx={{
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#081b6e",
          }}
        >
          {/* Background video */}
          <Box
            component="video"
            autoPlay
            loop
            muted
            playsInline
            src="https://hrcdn.net/fcore/assets/onboarding/globe-5fdfa9a0f4.mp4"
            sx={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              top: 0,
              left: 0,
              opacity: 0.45,
            }}
          />

          {/* Dark overlay */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(5, 7, 17, 0.7) 0%, rgba(16, 15, 17, 0.6) 100%)",
            }}
          />

          {/* Content */}
          <Box
            sx={{
                // bgcolor:"red",
              position: "relative",
              zIndex: 2,
              color: "white",
              textAlign: "left",
              px: 10,
            }}
          >
            <Box
              component="img"
              src="https://hrcdn.net/fcore/assets/work/header/hackerrank_logo-21e2867566.svg"
              alt="logo"
              sx={{ width: 50, mb: 40 }}
            />

            <Typography variant="h6" sx={{ mb: 1 }}>
              Welcome to
            </Typography>

            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Inventory Management System
            </Typography>

            <Typography variant="body2" sx={{ opacity: 0.9, mb: 3 }}>
              Centralized Inventory Hub
            </Typography>

            {/* <MuiLink
              href="https://www.hackerrank.com/about-us"
              underline="hover"
              sx={{ color: "white", fontWeight: 500 }}
              target="_blank"
            >
              Know more →
            </MuiLink> */}
          </Box>
        </Grid>

        {/* RIGHT SIDE (Your Login Form Goes Here) */}
        <Grid
          sx={{
            flexGrow: 1,
            flexBasis: "40%",
            bgcolor: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Stack spacing={3}>
                  <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{ fontWeight: 700 }}
              >
                Inventory Management System
              </Typography>
              {/* <Typography
                variant="h5"
                component="h1"
                gutterBottom
                sx={{ fontWeight: 700 }}
              >
                Welcome
              </Typography> */}
              <Typography variant="body2" color="text.secondary">
                Sign in to your inventory management account
              </Typography>
            </Box>
                <TextField
                  label="Email Address"
                  type="email"
                  {...register("email")}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  fullWidth
                  placeholder="Enter your email"
                  disabled={isLoading || showSuccess}
                  //   autoComplete="off"
                  sx={{
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "& .MuiOutlinedInput-root": {
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover fieldset": {
                        borderColor: "rgba(102, 126, 234, 0.5)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#667eea",
                        boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
                      },
                    },
                  }}
                />

                <TextField
                  label="Password"
                  type="password"
                  {...register("password")}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  fullWidth
                  placeholder="Enter your password"
                  disabled={isLoading || showSuccess}
                  //   autoComplete="off"
                  sx={{
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "& .MuiOutlinedInput-root": {
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover fieldset": {
                        borderColor: "rgba(102, 126, 234, 0.5)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#667eea",
                        boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
                      },
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading || showSuccess}
                  startIcon={
                    isLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : null
                  }
                  sx={{
                    position: "relative",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    background: showSuccess
                      ? "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)"
                      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    boxShadow: showSuccess
                      ? "0 4px 20px rgba(76, 175, 80, 0.4)"
                      : "0 4px 20px rgba(102, 126, 234, 0.3)",
                    transform: "translateY(0)",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 25px rgba(102, 126, 234, 0.5)",
                    },
                    "&:active": {
                      transform: "translateY(0)",
                    },
                    "&.Mui-disabled": {
                      background: showSuccess
                        ? "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)"
                        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      transform: "translateY(0)",
                    },
                    "@media (prefers-reduced-motion: reduce)": {
                      transition: "none",
                      "&:hover": {
                        transform: "none",
                      },
                    },
                  }}
                >
                  {showSuccess ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CheckIcon sx={{ fontSize: 20 }} />
                      Success!
                    </Box>
                  ) : isLoading ? (
                    "Signing in..."
                  ) : (
                    "Sign In"
                  )}
                </Button>
                <Box
              sx={{
                textAlign: "center",
                pt: 2,
                borderTop: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{" "}
                <MuiLink
                  component={Link}
                  to="/register"
                  sx={{ fontWeight: 500 }}
                >
                  Create one here
                </MuiLink>
              </Typography>
            </Box>

                {/* Error Alert */}
                <Collapse in={!!errors.root?.message}>
                  <Alert
                    severity="error"
                    icon={<ErrorIcon />}
                    sx={{
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "error.light",
                      backgroundColor: "rgba(244, 67, 54, 0.1)",
                      backdropFilter: "blur(10px)",
                      animation: errors.root?.message
                        ? "errorShake 0.6s ease-out"
                        : "none",
                      "@keyframes errorShake": {
                        "0%, 100%": { transform: "translateX(0)" },
                        "10%, 30%, 50%, 70%, 90%": {
                          transform: "translateX(-6px)",
                        },
                        "20%, 40%, 60%, 80%": { transform: "translateX(6px)" },
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {errors.root?.message}
                    </Typography>
                  </Alert>
                </Collapse>

                {/* Success Alert */}
                <Box
                  sx={{
                    opacity: showSuccess ? 1 : 0,
                    transform: showSuccess ? "translateY(0px)" : "translateY(-8px)",
                    transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                    pointerEvents: showSuccess ? "auto" : "none",
                  }}
                >
                  <Alert
                    severity="success"
                    sx={{
                      borderRadius: 2,
                      border: "none",
                      backgroundColor: "rgba(76, 175, 80, 0.08)",
                      color: "#2e7d32",
                      backdropFilter: "blur(8px)",
                      "& .MuiAlert-icon": {
                        color: "#4caf50",
                      },
                      pl: 3,
                      py: 1.5,
                      textAlign: "center",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Welcome back! Redirecting...
                    </Typography>
                  </Alert>
                </Box>
              </Stack>
            </Box>
            
          </Box>
        </Grid>
      </Grid>

      <WarehouseSelectionModal
        open={showWarehouseModal}
        userName={user?.name || "User"}
        onSelect={handleWarehouseSelect}
        onBack={handleBackToLogin}
      />
    </Box>
  );
};

export default Login;
