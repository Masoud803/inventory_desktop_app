// frontend/src/pages/SettingsPage.jsx
import React from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed
import UserManagementAdmin from '../components/admin/UserManagementAdmin'; // Adjust path if needed

const SettingsPage = () => {
  const { user } = useAuth();
  const isAdminOrSuperAdmin = user && (user.role === 'admin' || user.role === 'super_admin');

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      {/* "My Profile" section removed from here */}

      {isAdminOrSuperAdmin && (
        <>
          {/* <Divider sx={{ my: 3 }} /> // Divider can be optional if My Profile is gone */}
          <UserManagementAdmin /> 
        </>
      )}
      
      <Divider sx={{ my: 3 }} /> {/* This can be above UserManagementAdmin or removed if only one section remains for non-admins */}
      <Paper elevation={2} sx={{ p: 2, mt: isAdminOrSuperAdmin ? 3 : 0 }}> {/* Adjust margin if needed */}
          <Typography variant="h6">Appearance</Typography>
          <Button variant="outlined" sx={{mt:1}} disabled>Toggle Theme (Coming Soon)</Button>
      </Paper>
    </Box>
  );
};
export default SettingsPage;



// // frontend/src/pages/SettingsPage.jsx
// import Typography from '@mui/material/Typography';

// const SettingsPage = () => <Typography variant="h4">Settings Page</Typography>;
// export default SettingsPage;