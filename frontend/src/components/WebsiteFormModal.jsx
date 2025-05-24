// frontend/src/components/WebsiteFormModal.jsx (or components/websites/WebsiteFormModal.jsx)
import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Alert from '@mui/material/Alert';
import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed

const WebsiteFormModal = ({ open, onClose, onSave, websiteData }) => {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!websiteData; // Check if we are editing or adding new

  useEffect(() => {
    if (isEditing && websiteData) {
      setName(websiteData.name || '');
      setUrl(websiteData.url || '');
      setDescription(websiteData.description || '');
    } else {
      // Reset form for new entry
      setName('');
      setUrl('');
      setDescription('');
    }
    setError(''); // Clear error when modal opens or data changes
  }, [websiteData, open, isEditing]); // Rerun when websiteData or open state changes

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    if (!name) {
      setError("Website name cannot be empty.");
      setLoading(false);
      return;
    }

    const payload = { name, url, description };
    const endpoint = isEditing 
      ? `http://localhost:3001/api/websites/${websiteData.id}` 
      : 'http://localhost:3001/api/websites';
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
        throw new Error(responseData.message || `Failed to ${isEditing ? 'update' : 'create'} website`);
      }
      
      onSave(); // Callback to refresh the list in parent component
      handleClose(); // Close modal on success
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return; // Don't close if submitting
    setError(''); // Clear errors when closing
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
      <DialogTitle>{isEditing ? 'Edit Website' : 'Add New Website'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <DialogContentText sx={{mb: 2}}>
          {isEditing 
            ? `Please update the details for "${websiteData?.name}".`
            : 'To add a new website, please enter its details here.'
          }
        </DialogContentText>
        <TextField
          autoFocus
          required
          margin="dense"
          id="name"
          label="Website Name"
          type="text"
          fullWidth
          variant="standard"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
        <TextField
          margin="dense"
          id="url"
          label="Website URL (e.g., http://example.com)"
          type="url"
          fullWidth
          variant="standard"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />
        <TextField
          margin="dense"
          id="description"
          label="Description"
          type="text"
          fullWidth
          multiline
          rows={3}
          variant="standard"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading} color="inherit">Cancel</Button>
        <Button type="submit" disabled={loading} variant="contained">
          {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Website')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WebsiteFormModal;