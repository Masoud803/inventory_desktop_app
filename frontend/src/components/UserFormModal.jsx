// frontend/src/components/UserFormModal.jsx (or components/admin/UserFormModal.jsx)
import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed
// Assuming Role enum is 'USER', 'ADMIN', 'SUPER_ADMIN' from your backend User model
// You might need to define this enum in frontend as well if not getting it from backend
const roles = ['USER', 'ADMIN', 'SUPER_ADMIN'];

const UserFormModal = ({ open, onClose, onSave, userData, isCreatingNew }) => {
  const { token } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER'); // Default role for new user
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !isCreatingNew && !!userData;

  useEffect(() => {
    if (open) { // Reset form when modal opens
      if (isEditing && userData) {
        setUsername(userData.username || '');
        setEmail(userData.email || '');
        setRole(userData.role || 'USER');
        setPassword(''); // Password field should be empty for editing, admin sets new if needed
      } else { // For creating new user
        setUsername('');
        setEmail('');
        setPassword('');
        setRole('USER');
      }
      setError('');
    }
  }, [userData, open, isEditing]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !email || (isCreatingNew && !password)) {
      setError("Username, email, and password (for new user) are required.");
      setLoading(false);
      return;
    }
    if (isCreatingNew && password.length < 6) {
        setError("Password must be at least 6 characters long for new user.");
        setLoading(false);
        return;
    }

    const payload = { username, email, role };
    if (isCreatingNew || password) { // Only include password if creating new or if admin provided a new one for update
      payload.password = password;
    }

    const endpoint = isEditing 
      ? `http://localhost:3001/api/users/${userData.id}` // Admin update user route
      : 'http://localhost:3001/api/users';            // Admin create user route
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || `Failed to ${isEditing ? 'update' : 'create'} user`);
      }
      
      onSave();    // Callback to refresh the user list
      handleClose(); // Close modal on success
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
      <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          autoFocus={isCreatingNew} // Autofocus only when creating
          required
          margin="dense"
          id="username"
          label="Username"
          type="text"
          fullWidth
          variant="standard"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />
        <TextField
          required
          margin="dense"
          id="email"
          label="Email Address"
          type="email"
          fullWidth
          variant="standard"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <TextField
          required={isCreatingNew} // Password required only for new user
          margin="dense"
          id="password"
          label={isCreatingNew ? "Password (min 6 chars)" : "New Password (optional)"}
          type="password"
          fullWidth
          variant="standard"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          helperText={isEditing ? "Leave blank to keep current password." : ""}
        />
        <FormControl fullWidth margin="dense" variant="standard" disabled={loading}>
          <InputLabel id="role-select-label">Role</InputLabel>
          <Select
            labelId="role-select-label"
            id="role-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            label="Role"
          >
            {roles.map((r) => (
              <MenuItem key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1).toLowerCase()} {/* Capitalize roles */}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading} color="inherit">Cancel</Button>
        <Button type="submit" disabled={loading} variant="contained">
          {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add User')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default UserFormModal;