// frontend/src/pages/WebsitesPage.jsx
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
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
import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed
import WebsiteFormModal from '../components/WebsiteFormModal'; // Adjust path if needed

const WebsitesPage = () => {
  const [websites, setWebsites] = useState([]);
  const [error, setError] = useState('');
  const { token, user } = useAuth();

  const [openModal, setOpenModal] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState(null);

  const fetchWebsites = useCallback(async () => {
    setError('');
    if (!token) {
      setError("Authentication token not found. Please login again.");
      setWebsites([]);
      return;
    }
    try {
      const response = await fetch('http://localhost:3001/api/websites', {
        headers: { 'x-access-token': token },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to fetch websites');
      }
      const data = await response.json();
      setWebsites(data);
    } catch (err) {
      setError(err.message);
      setWebsites([]);
    }
  }, [token]); // fetchWebsites depends on token

  useEffect(() => {
    if (token) {
      fetchWebsites();
    }
  }, [token, fetchWebsites]); // Added fetchWebsites to dependency array

  const handleOpenAddModal = () => {
    setEditingWebsite(null);
    setOpenModal(true);
  };

  const handleOpenEditModal = (website) => {
    setEditingWebsite(website);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingWebsite(null);
  };

  const handleSaveWebsite = () => {
    fetchWebsites(); 
  };

  const handleDeleteWebsite = async (websiteId) => {
    if (!window.confirm("Are you sure you want to delete this website?")) return;
    setError('');
    try {
      const response = await fetch(`http://localhost:3001/api/websites/${websiteId}`, {
        method: 'DELETE',
        headers: { 'x-access-token': token },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to delete website');
      }
      fetchWebsites();
    } catch (err) {
      setError(err.message);
    }
  };
  
  const canUserCreateUpdate = user && (user.role === 'user' || user.role === 'admin' || user.role === 'super_admin');
  const canUserDelete = user && (user.role === 'admin' || user.role === 'super_admin');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Websites Management
        </Typography>
        {canUserCreateUpdate && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddModal}
          >
            Add Website
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 650 }} aria-label="websites table">
          <TableHead sx={{ backgroundColor: (theme) => theme.palette.grey[200] }}> {/* <<--- STYLED TABLE HEAD */}
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>URL</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {websites.length === 0 && !error && (
                <TableRow>
                    <TableCell colSpan={4} align="center">No websites found. Click "Add Website" to create one.</TableCell>
                </TableRow>
            )}
            {websites.map((website) => (
              <TableRow
                key={website.id}
                hover
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">{website.name}</TableCell>
                <TableCell>{website.url || '-'}</TableCell>
                <TableCell>{website.description || '-'}</TableCell>
                <TableCell align="right">
                  {canUserCreateUpdate && (
                    <IconButton onClick={() => handleOpenEditModal(website)} color="primary" title="Edit Website">
                      <EditIcon />
                    </IconButton>
                  )}
                  {canUserDelete && (
                    <IconButton onClick={() => handleDeleteWebsite(website.id)} color="error" title="Delete Website">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {openModal && ( // Conditionally render modal
        <WebsiteFormModal 
          open={openModal} 
          onClose={handleCloseModal}
          onSave={handleSaveWebsite}
          websiteData={editingWebsite} 
        />
      )}
    </Box>
  );
};

export default WebsitesPage;