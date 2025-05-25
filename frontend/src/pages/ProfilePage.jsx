// frontend/src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom'; // Added useNavigate
import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

const ProfilePage = () => {
  const { user, token, setUser } = useAuth(); // Ensure setUser is available from AuthContext
  const navigate = useNavigate(); // For redirecting after actions

  const [currentUsername, setCurrentUsername] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  
  const [editableUsername, setEditableUsername] = useState('');
  const [editableEmail, setEditableEmail] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setCurrentUsername(user.username || '');
      setCurrentEmail(user.email || '');
      setEditableUsername(user.username || ''); 
      setEditableEmail(user.email || '');      
    }
  }, [user]);

  const handleEditToggle = () => {
    if (isEditing) { 
      setEditableUsername(currentUsername); 
      setEditableEmail(currentEmail);
    }
    setIsEditing(!isEditing);
    setError('');
    setSuccess('');
  };

  const handleSubmitProfileUpdate = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const payload = {};
    if (editableUsername !== currentUsername) {
      payload.username = editableUsername;
    }
    if (editableEmail !== currentEmail) {
      payload.email = editableEmail;
    }

    if (Object.keys(payload).length === 0) {
      setSuccess("No changes made to save.");
      setIsEditing(false);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update profile');
      }
      setSuccess(responseData.message || 'Profile updated successfully!');
      
      const updatedUserDetails = { 
        ...user, 
        username: payload.username !== undefined ? payload.username : user.username,
        email: payload.email !== undefined ? payload.email : user.email,
      };
      localStorage.setItem('user', JSON.stringify(updatedUserDetails));
      if (setUser) { // Check if setUser exists before calling
        setUser(updatedUserDetails); 
      }


      setCurrentUsername(updatedUserDetails.username);
      setCurrentEmail(updatedUserDetails.email);

      setIsEditing(false); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToChangePassword = () => {
    navigate('/change-password');
  };

  if (!user) {
    return <Typography sx={{p:3}}>Please log in to view your profile.</Typography>;
  }

  return (
    <Box sx={{p:3, maxWidth: '600px', margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>My Profile</Typography>
      <Paper sx={{p:3, mt:2}} elevation={3}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        {!isEditing ? (
          <Box>
            <Typography variant="h6" gutterBottom>Profile Details</Typography>
            <Typography variant="body1" sx={{mb:1}}><strong>Username:</strong> {currentUsername}</Typography>
            <Typography variant="body1" sx={{mb:1}}><strong>Email:</strong> {currentEmail}</Typography>
            <Typography variant="body1" sx={{mb:2}}><strong>Role:</strong> {user.role?.toUpperCase()}</Typography>
            <Button variant="contained" onClick={handleEditToggle} sx={{mr:1}}>Edit Profile</Button>
            {/* Changed RouterLink to a Button that navigates */}
            <Button variant="outlined" onClick={navigateToChangePassword}>Change Password</Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmitProfileUpdate} noValidate>
            <Typography variant="h6" gutterBottom>Edit Profile</Typography>
            <TextField
              margin="normal"
              fullWidth
              id="username_profile"
              label="Username"
              name="username_profile"
              value={editableUsername}
              onChange={(e) => setEditableUsername(e.target.value)}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email_profile"
              label="Email Address"
              name="email_profile"
              type="email"
              value={editableEmail}
              onChange={(e) => setEditableEmail(e.target.value)}
              disabled={loading}
            />
            <Box sx={{mt: 2, display: 'flex', justifyContent: 'flex-end'}}>
              <Button onClick={handleEditToggle} sx={{mr:1}} color="inherit" disabled={loading}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};
export default ProfilePage;