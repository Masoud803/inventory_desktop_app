// frontend/src/components/SupplierFormModal.jsx
import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
// For multi-select websites:
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Chip from '@mui/material/Chip';

import { useAuth } from '../contexts/AuthContext';

const SupplierFormModal = ({ open, onClose, onSave, supplierData, allWebsites = [] }) => {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [selectedWebsiteIds, setSelectedWebsiteIds] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!supplierData;

  useEffect(() => {
    if (isEditing && supplierData) {
      setName(supplierData.name || '');
      setContactPerson(supplierData.contact_person || '');
      setPhone(supplierData.phone || '');
      setEmail(supplierData.email || '');
      setAddress(supplierData.address || '');
      setSelectedWebsiteIds(supplierData.websites ? supplierData.websites.map(ws => ws.id) : []);
    } else {
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setSelectedWebsiteIds([]);
    }
    setError('');
  }, [supplierData, open, isEditing]);

  const handleWebsiteChange = (event) => {
    const { target: { value } } = event;
    setSelectedWebsiteIds(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    if (!name) {
      setError("Supplier name cannot be empty.");
      setLoading(false);
      return;
    }

    const payload = { name, contact_person: contactPerson, phone, email, address, websiteIds: selectedWebsiteIds };
    const endpoint = isEditing 
      ? `http://localhost:3001/api/suppliers/${supplierData.id}` 
      : 'http://localhost:3001/api/suppliers';
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
        throw new Error(responseData.message || `Failed to ${isEditing ? 'update' : 'create'} supplier`);
      }
      onSave();
      handleClose();
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
      <DialogTitle>{isEditing ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField autoFocus required margin="dense" id="name" label="Supplier Name" type="text" fullWidth variant="standard" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
        <TextField margin="dense" id="contactPerson" label="Contact Person" type="text" fullWidth variant="standard" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} disabled={loading} />
        <TextField margin="dense" id="phone" label="Phone" type="text" fullWidth variant="standard" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={loading} />
        <TextField margin="dense" id="email" label="Email" type="email" fullWidth variant="standard" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
        <TextField margin="dense" id="address" label="Address" type="text" fullWidth multiline rows={2} variant="standard" value={address} onChange={(e) => setAddress(e.target.value)} disabled={loading} />
        
        <FormControl fullWidth margin="dense" variant="standard" disabled={loading}>
          <InputLabel id="websites-select-label">Link to Websites</InputLabel>
          <Select
            labelId="websites-select-label"
            id="websites-select"
            multiple
            value={selectedWebsiteIds}
            onChange={handleWebsiteChange}
            input={<OutlinedInput id="select-multiple-chip" label="Link to Websites" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {allWebsites.filter(ws => selected.includes(ws.id)).map((ws) => (
                  <Chip key={ws.id} label={ws.name} />
                ))}
              </Box>
            )}
          >
            {allWebsites.map((website) => (
              <MenuItem key={website.id} value={website.id}>
                {website.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading} color="inherit">Cancel</Button>
        <Button type="submit" disabled={loading} variant="contained">{loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Supplier')}</Button>
      </DialogActions>
    </Dialog>
  );
};
export default SupplierFormModal;