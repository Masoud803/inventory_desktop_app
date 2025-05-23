// frontend/src/components/Sidebar.jsx
// import React from 'react';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { Link as RouterLink } from 'react-router-dom';

// Icons (example - make sure to import them)
import DashboardIcon from '@mui/icons-material/Dashboard';
import WebIcon from '@mui/icons-material/Web';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssessmentIcon from '@mui/icons-material/Assessment'; // For Reports
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'; // For Recycle Bin
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'; // For Sales
import WarehouseIcon from '@mui/icons-material/Warehouse'; // For Stock

const drawerWidth = 240;

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Websites', icon: <WebIcon />, path: '/websites' },
    { text: 'Suppliers', icon: <PeopleIcon />, path: '/suppliers' },
    { text: 'Categories', icon: <CategoryIcon />, path: '/categories' },
    { text: 'Products', icon: <InventoryIcon />, path: '/products' },
    { text: 'Stock', icon: <WarehouseIcon />, path: '/stock' },
    { text: 'Sales', icon: <PointOfSaleIcon />, path: '/sales' },
    { text: 'Recycle Bin', icon: <DeleteSweepIcon />, path: '/recycle-bin' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const drawerContent = (
    <div>
      <Toolbar />
      <List>
        {menuItems.map((item) => ( // Removed index as key, item.path is better if unique
          <ListItem key={item.path} disablePadding component={RouterLink} to={item.path} sx={{ color: 'inherit', textDecoration: 'none' }}>
            <ListItemButton>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={handleDrawerToggle}
      ModalProps={{ keepMounted: true }}
      sx={{
        display: { xs: 'block' }, // Keeping it simple as temporary for all screens for now
        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};
export default Sidebar;