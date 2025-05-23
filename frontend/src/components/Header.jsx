// frontend/src/components/Header.jsx
import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Button from '@mui/material/Button'; // For Logout
import Box from '@mui/material/Box'; // For spacing
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { useNavigate } from 'react-router-dom';

const Header = ({ toggleDrawer }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login after logout
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {isAuthenticated && ( // Show menu icon only if authenticated
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Inventory Management {user ? `- Welcome, ${user.username}!` : ''}
        </Typography>
        {isAuthenticated && (
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};
export default Header;





// // frontend/src/components/Header.jsx
// // import React from 'react';
// import AppBar from '@mui/material/AppBar';
// import Toolbar from '@mui/material/Toolbar';
// import Typography from '@mui/material/Typography';
// import IconButton from '@mui/material/IconButton';
// import MenuIcon from '@mui/icons-material/Menu';

// // 'toggleDrawer' prop aayega AppLayout se sidebar ko open/close karne ke liye
// const Header = ({ toggleDrawer }) => {
//   return (
//     <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
//       <Toolbar>
//         <IconButton
//           color="inherit"
//           aria-label="open drawer"
//           edge="start"
//           onClick={toggleDrawer}
//           sx={{ mr: 2 }} // Responsive sidebar ke liye 'md' breakpoint pe hide kar sakte hain
//         >
//           <MenuIcon />
//         </IconButton>
//         <Typography variant="h6" noWrap component="div">
//           Inventory Management
//         </Typography>
//       </Toolbar>
//     </AppBar>
//   );
// };
// export default Header;