// frontend/src/components/Header.jsx
import React, { useState } from 'react'; // Added useState for Menu
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle'; // Profile Icon
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
// Removed Button import for Logout as it will be a MenuItem
import Box from '@mui/material/Box';
import { useAuth } from '../contexts/AuthContext'; // Adjust path
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // Import RouterLink

const Header = ({ toggleDrawer }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null); // State for Menu anchor

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleCloseMenu(); // Close menu after action
    navigate('/login');
  };

  const handleProfile = () => {
    handleCloseMenu();
    navigate('/profile'); // Navigate to Profile page (we will create this page)
  };
  
  const handleChangePassword = () => {
    handleCloseMenu();
    navigate('/change-password'); // Navigate to Change Password page (we will create this)
  };


  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {isAuthenticated && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }} // Only show on small screens if sidebar is permanent on md+
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Blindmakers Australia {user ? `- Welcome, ${user.username}!` : ''}
        </Typography>
        {isAuthenticated && (
          <div>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
            >
              <MenuItem onClick={handleProfile}>My Profile</MenuItem>
              <MenuItem onClick={handleChangePassword}>Change Password</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </div>
        )}
      </Toolbar>
    </AppBar>
  );
};
export default Header;