import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';

// Type declaration for setTimeout
declare const setTimeout: (callback: () => void, delay: number) => number;
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
  Fade
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [redirectTimeout, setRedirectTimeout] = useState<number | null>(null);
  const registerUser = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [redirectTimeout]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setShowSuccess(false);
      clearErrors(); // Clear any previous errors
      
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      // Show success animation
      setShowSuccess(true);

      // Redirect to login after animation completes
      const timer = setTimeout(() => {
        navigate({ to: '/login', replace: true });
      }, 500);
      
      setRedirectTimeout(timer);

    } catch (error) {
      setShowSuccess(false);
      const errorMessage = error instanceof Error && error.message.includes('409')
        ? 'This email is already registered. Please use a different email.'
        : error instanceof Error
          ? error.message
          : 'Unable to complete registration. Please try again.';

      setError('root', { message: errorMessage });
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        position: 'relative',
        p: 3,
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '50%',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
        }
      }}
    >
      <Paper
        elevation={10}
        sx={{
          position: 'relative',
          zIndex: 1,
          p: 4,
          maxWidth: 450,
          mr: 8,
          borderRadius: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Join our inventory management system
          </Typography>
        </Box>

        {/* Success Animation */}
        <Collapse in={showSuccess}>
          <Fade in={showSuccess}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 4,
                py: 4,
                px: 2,
                background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                borderRadius: 3,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                animation: 'successPulse 0.6s ease-out',
                '@keyframes successPulse': {
                  '0%': {
                    opacity: 0,
                    transform: 'scale(0.9) translateY(-20px)',
                  },
                  '50%': {
                    transform: 'scale(1.05)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'scale(1) translateY(0)',
                  },
                },
              }}
            >
              {/* Animated Success Icon */}
              <Box
                sx={{
                  position: 'relative',
                  mb: 2,
                  animation: 'iconRotate 1.2s ease-in-out',
                  '@keyframes iconRotate': {
                    '0%': { transform: 'rotate(-180deg) scale(0.5)', opacity: 0 },
                    '50%': { transform: 'rotate(-90deg) scale(1.1)', opacity: 0.8 },
                    '100%': { transform: 'rotate(0deg) scale(1)', opacity: 1 },
                  },
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    animation: 'circleGlow 2s ease-in-out infinite',
                    '@keyframes circleGlow': {
                      '0%, 100%': { boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)' },
                      '50%': { boxShadow: '0 0 30px rgba(255, 255, 255, 0.5)' },
                    },
                  }}
                >
                  <CheckIcon 
                    sx={{ 
                      fontSize: 32,
                      color: 'white',
                      animation: 'checkDraw 0.8s ease-out 0.4s both',
                      '@keyframes checkDraw': {
                        '0%': { pathLength: 0, opacity: 0 },
                        '100%': { pathLength: 1, opacity: 1 },
                      },
                    }} 
                  />
                </Box>
              </Box>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  textAlign: 'center',
                  animation: 'textSlideIn 0.5s ease-out 0.3s both',
                  '@keyframes textSlideIn': {
                    '0%': { opacity: 0, transform: 'translateY(10px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                  },
                }}
              >
                Account Created!
              </Typography>
              
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.9,
                  textAlign: 'center',
                  mt: 1,
                  animation: 'textSlideIn 0.5s ease-out 0.5s both',
                }}
              >
                Redirecting to login...
              </Typography>

              {/* Loading dots */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  mt: 2,
                  animation: 'fadeIn 0.8s ease-out 0.6s both',
                  '@keyframes fadeIn': {
                    '0%': { opacity: 0 },
                    '100%': { opacity: 1 },
                  },
                }}
              >
                {[0, 1, 2].map((index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      animation: `dotBounce 1.4s ease-in-out ${index * 0.2}s infinite`,
                      '@keyframes dotBounce': {
                        '0%, 80%, 100%': { 
                          transform: 'scale(0.8)',
                          opacity: 0.5,
                        },
                        '40%': { 
                          transform: 'scale(1)',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Fade>
        </Collapse>

        {/* Error Alert - Positioned above form */}
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <TextField
              label="Full Name"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
              fullWidth
              placeholder="Enter your full name"
              disabled={isLoading || showSuccess}
              sx={{
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '& .MuiOutlinedInput-root': {
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover fieldset': {
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                  },
                },
              }}
            />

            <TextField
              label="Email Address"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              fullWidth
              placeholder="Enter your email"
              disabled={isLoading || showSuccess}
              sx={{
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '& .MuiOutlinedInput-root': {
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover fieldset': {
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                  },
                },
              }}
            />

            <TextField
              label="Password"
              type="password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              fullWidth
              placeholder="Create a password"
              disabled={isLoading || showSuccess}
              autoComplete="off"
              sx={{
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '& .MuiOutlinedInput-root': {
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover fieldset': {
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                  },
                },
              }}
            />

            <TextField
              label="Confirm Password"
              type="password"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              fullWidth
              placeholder="Confirm your password"
              disabled={isLoading || showSuccess}
              autoComplete="off"
              sx={{
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '& .MuiOutlinedInput-root': {
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover fieldset': {
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
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
                position: 'relative',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                background: showSuccess 
                  ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: showSuccess 
                  ? '0 4px 20px rgba(76, 175, 80, 0.4)'
                  : '0 4px 20px rgba(102, 126, 234, 0.3)',
                transform: 'translateY(0)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: showSuccess 
                    ? '0 6px 25px rgba(76, 175, 80, 0.6)'
                    : '0 6px 25px rgba(102, 126, 234, 0.5)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                '&.Mui-disabled': {
                  background: showSuccess 
                    ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  transform: 'translateY(0)',
                },
                '@media (prefers-reduced-motion: reduce)': {
                  transition: 'none',
                  '&:hover': {
                    transform: 'none',
                  },
                },
              }}
            >
              {showSuccess ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon sx={{ fontSize: 20 }} />
                  Success!
                </Box>
              ) : isLoading ? (
                'Creating Account...'
              ) : (
                'Create Account'
              )}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <MuiLink component={Link} to="/login" sx={{ fontWeight: 500 }}>
              Sign in here
            </MuiLink>
          </Typography>
        </Box>

        {/* Error Alert */}
        {errors.root?.message && (
          <Fade in={true}>
            <Alert
              severity="error"
              icon={<ErrorIcon />}
              sx={{
                mt: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'error.light',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                backdropFilter: 'blur(10px)',
                animation: 'errorShake 0.6s ease-out, fadeInSlide 0.4s ease-out',
                '& .MuiAlert-message': {
                  animation: 'errorPulse 2s ease-in-out infinite',
                  '@keyframes errorPulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.8 },
                  },
                },
                '@keyframes errorShake': {
                  '0%, 100%': { transform: 'translateX(0)' },
                  '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-6px)' },
                  '20%, 40%, 60%, 80%': { transform: 'translateX(6px)' },
                  '@media (prefers-reduced-motion: reduce)': {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-3px)' },
                    '20%, 40%, 60%, 80%': { transform: 'translateX(3px)' },
                  },
                },
                '@keyframes fadeInSlide': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(-10px) scale(0.95)'
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0) scale(1)'
                  },
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {errors.root?.message}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                Please check your information and try again
              </Typography>
            </Alert>
          </Fade>
        )}
      </Paper>
    </Box>
  );
};

export default Register;