// frontend/src/pages/SuppliersPage.jsx
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
import LinkIcon from '@mui/icons-material/Link';
import Alert from '@mui/material/Alert';
import { useAuth } from '../contexts/AuthContext';
import SupplierFormModal from '../components/SupplierFormModal';

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [allWebsites, setAllWebsites] = useState([]);
  const [error, setError] = useState('');
  const { token, user } = useAuth();

  const [openSupplierModal, setOpenSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const fetchSuppliers = useCallback(async () => { /* ... (same as before) ... */
    setError('');
    if (!token) { setError("Authentication token not found. Please login again."); setSuppliers([]); return; }
    try {
      const response = await fetch('http://localhost:3001/api/suppliers', { headers: { 'x-access-token': token }});
      if (!response.ok) { const errData = await response.json(); throw new Error(errData.message || 'Failed to fetch suppliers'); }
      const data = await response.json();
      setSuppliers(data);
    } catch (err) { setError(err.message); setSuppliers([]); }
  }, [token]);

  const fetchAllWebsites = useCallback(async () => { /* ... (same as before) ... */
    if (!token) return;
    try {
      const response = await fetch('http://localhost:3001/api/websites', { headers: { 'x-access-token': token }});
      if (!response.ok) { console.error('Failed to fetch websites for supplier form'); setAllWebsites([]); return; }
      const data = await response.json();
      setAllWebsites(data);
    } catch (err) { console.error("Error fetching websites for dropdown:", err); setAllWebsites([]); }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchSuppliers();
      fetchAllWebsites();
    } else {
      setSuppliers([]); setAllWebsites([]); setError("Please login to view suppliers.");
    }
  }, [token, fetchSuppliers, fetchAllWebsites]);

  const handleOpenAddModal = () => { setEditingSupplier(null); setOpenSupplierModal(true); };
  const handleOpenEditModal = (supplier) => { setEditingSupplier(supplier); setOpenSupplierModal(true); };
  const handleCloseModal = () => { setOpenSupplierModal(false); setEditingSupplier(null); };
  const handleSaveSupplier = () => { fetchSuppliers(); };
  const handleDeleteSupplier = async (supplierId) => { /* ... (same as before) ... */
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;
    setError('');
    try {
      const response = await fetch(`http://localhost:3001/api/suppliers/${supplierId}`, { method: 'DELETE', headers: { 'x-access-token': token }});
      if (!response.ok) { const errData = await response.json(); throw new Error(errData.message || 'Failed to delete supplier'); }
      fetchSuppliers();
    } catch (err) { setError(err.message); }
  };
  const handleManageLinkedWebsites = (supplier) => { setEditingSupplier(supplier); setOpenSupplierModal(true); };
  
  // Updated Permissions
  const canUserCreateUpdate = user && (user.role === 'user' || user.role === 'admin' || user.role === 'super_admin');
  const canUserDelete = user && (user.role === 'admin' || user.role === 'super_admin');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>Suppliers Management</Typography>
        {canUserCreateUpdate && ( // <<--- Users can now see Add button
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenAddModal}>
            Add Supplier
          </Button>
        )}
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 650 }} aria-label="suppliers table">
          <TableHead sx={{ backgroundColor: (theme) => theme.palette.grey[200] }}>
            {/* ... (Table Head content same as before) ... */}
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Contact Person</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Linked Websites</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* ... (No suppliers found message - same as before) ... */}
             {suppliers.length === 0 && !error && (
              <TableRow><TableCell colSpan={7} align="center">No suppliers found.</TableCell></TableRow>
            )}
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id} hover>
                {/* ... (TableCells for supplier data - same as before) ... */}
                <TableCell component="th" scope="row">{supplier.name}</TableCell>
                <TableCell>{supplier.contact_person || '-'}</TableCell>
                <TableCell>{supplier.phone || '-'}</TableCell>
                <TableCell>{supplier.email || '-'}</TableCell>
                <TableCell>{supplier.address || '-'}</TableCell>
                <TableCell>
                  {supplier.websites && supplier.websites.length > 0 
                    ? supplier.websites.map(ws => ws.name).join(', ')
                    : 'None'}
                  {canUserCreateUpdate &&  // <<--- Users can now manage links (via edit modal)
                    <IconButton onClick={() => handleManageLinkedWebsites(supplier)} size="small" sx={{ml:1}} title="Manage Linked Websites" color="secondary">
                        <LinkIcon fontSize="inherit" />
                    </IconButton>
                  }
                </TableCell>
                <TableCell align="right">
                  {canUserCreateUpdate && ( // <<--- Users can now see Edit button
                    <IconButton onClick={() => handleOpenEditModal(supplier)} color="primary" title="Edit Supplier">
                      <EditIcon />
                    </IconButton>
                  )}
                  {canUserDelete && ( // Delete button only for Admin/SuperAdmin
                    <IconButton onClick={() => handleDeleteSupplier(supplier.id)} color="error" title="Delete Supplier">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {openSupplierModal && (
        <SupplierFormModal 
          open={openSupplierModal} 
          onClose={handleCloseModal}
          onSave={handleSaveSupplier}
          supplierData={editingSupplier}
          allWebsites={allWebsites}
        />
      )}
    </Box>
  );
};
export default SuppliersPage;