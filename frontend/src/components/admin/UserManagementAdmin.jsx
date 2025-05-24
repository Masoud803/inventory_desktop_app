// frontend/src/components/admin/UserManagementAdmin.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Alert from '@mui/material/Alert';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path
import UserFormModal from '../UserFormModal'; // Adjust path

const UserManagementAdmin = () => {
  const [usersList, setUsersList] = useState([]);
  const [error, setError] = useState('');
  const { token, user } = useAuth(); // Current logged-in user for role check

  const [openUserModal, setOpenUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isCreatingNewUser, setIsCreatingNewUser] = useState(false);


  const fetchUsers = useCallback(async () => {
    setError('');
    if (!token || !(user?.role === 'admin' || user?.role === 'super_admin')) {
      // setError("You are not authorized to view users."); // Or just don't fetch
      setUsersList([]);
      return;
    }
    try {
      const response = await fetch('http://localhost:3001/api/users', { // Admin route to get all users
        headers: { 'x-access-token': token },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to fetch users');
      }
      const data = await response.json();
      setUsersList(data);
    } catch (err) {
      setError(err.message);
      setUsersList([]);
    }
  }, [token, user]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // fetchUsers will re-run if token or user changes

  const handleOpenAddModal = () => {
    setIsCreatingNewUser(true);
    setEditingUser(null);
    setOpenUserModal(true);
  };

  const handleOpenEditModal = (userToEdit) => {
    setIsCreatingNewUser(false);
    setEditingUser(userToEdit);
    setOpenUserModal(true);
  };

  const handleCloseModal = () => {
    setOpenUserModal(false);
    setEditingUser(null);
    setIsCreatingNewUser(false);
  };

  const handleSaveUser = () => {
    fetchUsers(); // Refresh the list
  };

  const handleDeleteUser = async (userIdToDelete) => {
    if (userIdToDelete === user?.id) {
        alert("You cannot delete yourself!");
        return;
    }
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setError('');
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userIdToDelete}`, {
        method: 'DELETE',
        headers: { 'x-access-token': token },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to delete user');
      }
      fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ mt: 2 }}> {/* Added margin top */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom>Manage Users</Typography>
        <Button
          variant="contained"
          color="secondary" // Different color for admin action
          startIcon={<AddIcon />}
          onClick={handleOpenAddModal}
        >
          Add New User
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TableContainer component={Paper} elevation={2}>
        <Table sx={{ minWidth: 650 }} aria-label="users table">
          <TableHead sx={{ backgroundColor: (theme) => theme.palette.grey[300] }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Created At</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usersList.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell>{u.id}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role?.toUpperCase()}</TableCell>
                <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenEditModal(u)} color="primary" title="Edit User" disabled={u.id === user?.id && user.role !== 'super_admin' /* SuperAdmin can edit self, admin cannot */}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteUser(u.id)} color="error" title="Delete User" disabled={u.id === user?.id /* Prevent self-delete */}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {openUserModal && (
        <UserFormModal
          open={openUserModal}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
          userData={editingUser}
          isCreatingNew={isCreatingNewUser}
        />
      )}
    </Box>
  );
};

export default UserManagementAdmin;