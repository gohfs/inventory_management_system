import React from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useAuthStore } from '../../store/authStore';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Menu,
  MenuItem,
  Avatar,
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Warehouse as WarehouseIcon,
  PointOfSale as SellIcon
} from '@mui/icons-material';
import Logo from '../../assets/logo.jpg';


const Navbar: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
    handleClose();
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const normalizedRole = user?.role?.toUpperCase();
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN';

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
    { path: '/inventory', label: 'Inventory', icon: <InventoryIcon fontSize="small" /> },
    ...(isSuperAdmin ? [
      { path: '/warehouses', label: 'Warehouses', icon: <WarehouseIcon fontSize="small" /> },
      { path: '/sells', label: 'Sells', icon: <SellIcon fontSize="small" /> }
    ] : [])
  ];

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg,rgb(0, 30, 61) 0%,rgb(54, 52, 129) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: 'none',
        boxShadow: '0 4px 16px rgba(0, 122, 255, 0.1)'
      }}
    >
      <Container maxWidth="lg" disableGutters sx={{ px: { xs: 2, sm: 3 } }}>
        <Toolbar disableGutters sx={{ py: 1.5, minHeight: 64 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexGrow: 1,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)'
              }
            }}
            onClick={() => navigate({ to: '/dashboard' })}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                backdropFilter: 'blur(10px)'
              }}
            >
              <img src={Logo} alt="logo" style={{ maxHeight: '32px', maxWidth: '32px', borderRadius: '50%' }} />
            </Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                color: 'white',
                letterSpacing: '-0.5px'
              }}
            >
             Semesta Arus Teknologi
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                startIcon={item.icon}
                onClick={() => navigate({ to: item.path })}
                sx={{
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  background: currentPath === item.path
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'transparent',
                  backdropFilter: currentPath === item.path ? 'blur(10px)' : 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {item.label}
              </Button>
            ))}

            <Divider
              orientation="vertical"
              flexItem
              sx={{
                mx: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
                height: '32px',
                alignSelf: 'center'
              }}
            />

            <Chip
              avatar={
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}
                >
                  {user?.name ? getInitials(user.name) : 'U'}
                </Avatar>
              }
              label={user?.name?.split(' ')[0] || 'User'}
              onClick={handleMenu}
              deleteIcon={<ArrowDownIcon sx={{ color: 'white !important' }} />}
              onDelete={handleMenu}
              sx={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                fontWeight: 500,
                px: 1,
                height: 40,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.25)',
                  transform: 'translateY(-2px)'
                },
                '& .MuiChip-deleteIcon': {
                  color: 'white',
                  transition: 'transform 0.2s'
                },
                '&:hover .MuiChip-deleteIcon': {
                  transform: 'rotate(180deg)'
                }
              }}
            />

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  overflow: 'visible',
                  '&::before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 20,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  }
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
              <MenuItem
                onClick={handleClose}
                sx={{ gap: 1.5, py: 1.5 }}
              >
                <PersonIcon fontSize="small" color="action" />
                Profile
              </MenuItem>
              <MenuItem
                onClick={handleClose}
                sx={{ gap: 1.5, py: 1.5 }}
              >
                <SettingsIcon fontSize="small" color="action" />
                Settings
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={handleLogout}
                sx={{
                  gap: 1.5,
                  py: 1.5,
                  color: 'error.main',
                  '&:hover': {
                    bgcolor: 'error.lighter'
                  }
                }}
              >
                <LogoutIcon fontSize="small" />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;