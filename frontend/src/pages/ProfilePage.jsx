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



// // frontend/src/pages/ProfilePage.jsx
// import React, { useState, useEffect } from 'react';
// import { Link as RouterLink } from 'react-router-dom';
// import Typography from '@mui/material/Typography';
// import Box from '@mui/material/Box';
// import Paper from '@mui/material/Paper';
// import TextField from '@mui/material/TextField';
// import Button from '@mui/material/Button';
// import Alert from '@mui/material/Alert';
// import CircularProgress from '@mui/material/CircularProgress'; // For loading state
// import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed

// const ProfilePage = () => {
//   const { user, token } = useAuth(); // Assuming login updates user in context
//   const [email, setEmail] = useState('');
//   const [username, setUsername] = useState('');
//   // Add other fields if you want them to be editable, e.g., name, etc.

//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);

//   useEffect(() => {
//     if (user) {
//       setUsername(user.username || '');
//       setEmail(user.email || '');
//     }
//   }, [user]);

//   const handleEditToggle = () => {
//     setIsEditing(!isEditing);
//     setError('');
//     setSuccess('');
//     // Reset fields to current user details if canceling edit
//     if (isEditing && user) {
//         setUsername(user.username);
//         setEmail(user.email);
//     }
//   };

//   const handleSubmitProfileUpdate = async (event) => {
//     event.preventDefault();
//     setError('');
//     setSuccess('');
//     setLoading(true);

//     const payload = {
//       // Only send fields that are meant to be updatable
//       // For now, let's assume email is updatable. Username update can be tricky (uniqueness).
//       email: email,
//       // username: username, // Uncomment if you allow username update from profile
//     };

//     try {
//       const response = await fetch('http://localhost:3001/api/auth/profile', {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           'x-access-token': token,
//         },
//         body: JSON.stringify(payload),
//       });

//       const responseData = await response.json();
//       if (!response.ok) {
//         throw new Error(responseData.message || 'Failed to update profile');
//       }
//       setSuccess(responseData.message || 'Profile updated successfully!');
//       // To reflect changes immediately, you might need to update the user in AuthContext.
//       // This could involve fetching the user again or updating context with new details.
//       // For simplicity, we can ask user to re-login or just update local state for display.
//       // A better way is to have the login function in AuthContext update the user details there.
//       // Or, if the backend returns the updated user, use that.
//       // For now, just show success. If username/email is part of JWT, re-login would show new header.
//       setIsEditing(false); 
//       // You might need to update the user object in AuthContext here
//       // For example, by calling a function like `updateUserInContext(newDetails)`
//       // or by re-fetching user data.
//       // A simple way if backend returns updated user in 'responseData.user':
//       // if (responseData.user) {
//       //   localStorage.setItem('user', JSON.stringify(responseData.user));
//       //   login(null, null, responseData.user); // Re-use login to update context if it supports it
//       // }


//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };


//   if (!user) {
//     return <Typography>Please log in to view your profile.</Typography>;
//   }

//   return (
//     <Box sx={{p:3, maxWidth: '600px', margin: 'auto' }}> {/* Centered and max-width */}
//       <Typography variant="h4" gutterBottom>My Profile</Typography>
//       <Paper sx={{p:3, mt:2}} elevation={3}>
//         {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
//         {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
//         {!isEditing ? (
//           <Box>
//             <Typography variant="h6" gutterBottom>Profile Details</Typography>
//             <Typography variant="body1" sx={{mb:1}}><strong>Username:</strong> {user.username}</Typography>
//             <Typography variant="body1" sx={{mb:1}}><strong>Email:</strong> {user.email}</Typography>
//             <Typography variant="body1" sx={{mb:2}}><strong>Role:</strong> {user.role?.toUpperCase()}</Typography>
//             <Button variant="contained" onClick={handleEditToggle} sx={{mr:1}}>Edit Profile</Button>
//             <Button variant="outlined" component={RouterLink} to="/change-password">Change Password</Button>
//           </Box>
//         ) : (
//           <Box component="form" onSubmit={handleSubmitProfileUpdate} noValidate>
//             <Typography variant="h6" gutterBottom>Edit Profile</Typography>
//             <TextField
//               margin="normal"
//               fullWidth
//               id="username_profile"
//               label="Username"
//               name="username_profile"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               disabled={true} // Usually username is not editable or requires special handling
//               helperText="Username cannot be changed from here for now."
//             />
//             <TextField
//               margin="normal"
//               required
//               fullWidth
//               id="email_profile"
//               label="Email Address"
//               name="email_profile"
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               disabled={loading}
//             />
//             {/* Add other editable fields here */}
//             <Box sx={{mt: 2, display: 'flex', justifyContent: 'flex-end'}}>
//               <Button onClick={handleEditToggle} sx={{mr:1}} color="inherit" disabled={loading}>Cancel</Button>
//               <Button type="submit" variant="contained" disabled={loading}>
//                 {loading ? <CircularProgress size={24} /> : 'Save Changes'}
//               </Button>
//             </Box>
//           </Box>
//         )}
//       </Paper>
//     </Box>
//   );
// };
// export default ProfilePage;



// // frontend/src/pages/ProfilePage.jsx
// import React from 'react';
// import Typography from '@mui/material/Typography';
// import Box from '@mui/material/Box';
// import Paper from '@mui/material/Paper';
// import { useAuth } from '../contexts/AuthContext'; // Adjust path

// const ProfilePage = () => {
//   const { user } = useAuth();
//   return (
//     <Box sx={{p:3}}>
//       <Typography variant="h4" gutterBottom>My Profile</Typography>
//       <Paper sx={{p:2}}>
//         <Typography variant="body1"><strong>Username:</strong> {user?.username}</Typography>
//         <Typography variant="body1"><strong>Email:</strong> {user?.email}</Typography>
//         <Typography variant="body1"><strong>Role:</strong> {user?.role?.toUpperCase()}</Typography>
//         {/* TODO: Add form to edit details if allowed */}
//       </Paper>
//     </Box>
//   );
// };
// export default ProfilePage;