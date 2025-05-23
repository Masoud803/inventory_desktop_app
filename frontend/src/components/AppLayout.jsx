// frontend/src/components/AppLayout.jsx
import React from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Header from './Header';
import Sidebar from './Sidebar';
// import { Outlet } from 'react-router-dom'; // For nested routes content

const AppLayout = ({ children }) => { // 'children' prop render karega current page ko
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Header toggleDrawer={handleDrawerToggle} />
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${240}px)` } }} // 240px is drawerWidth
      >
        <Toolbar /> {/* AppBar ke neeche content push karne ke liye */}
        {/* <Outlet /> // Agar nested routes use kar rahe ho App.jsx mein */}
        {children} {/* Current page ka content yahan aayega */}
      </Box>
    </Box>
  );
};
export default AppLayout;