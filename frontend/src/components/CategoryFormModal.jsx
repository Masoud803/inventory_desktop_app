// frontend/src/components/CategoryFormModal.jsx
import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
// ... (other Dialog imports) ...
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import { useAuth } from '../contexts/AuthContext';

// allWebsites: to select which website this category belongs to
// allCategories: to select a parent category (for sub-category)
const CategoryFormModal = ({ open, onClose, onSave, categoryData, allWebsites = [], allCategories = [] }) => {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteId, setWebsiteId] = useState(''); // Category belongs to one website
  const [parentId, setParentId] = useState('');   // Optional parent category
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!categoryData;

  useEffect(() => {
    if (isEditing && categoryData) {
      setName(categoryData.name || '');
      setDescription(categoryData.description || '');
      setWebsiteId(categoryData.website_id || (categoryData.website ? categoryData.website.id : ''));
      setParentId(categoryData.parent_id || '');
    } else {
      setName('');
      setDescription('');
      setWebsiteId('');
      setParentId('');
    }
    setError('');
  }, [categoryData, open, isEditing]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    if (!name || !websiteId) { // Website ID is mandatory for a category
      setError("Category name and Website selection are required.");
      setLoading(false);
      return;
    }

    const payload = { 
      name, 
      description, 
      website_id: parseInt(websiteId), // Ensure it's a number if your backend expects int
      parent_id: parentId ? parseInt(parentId) : null // Ensure it's a number or null
    };
    const endpoint = isEditing 
      ? `http://localhost:3001/api/categories/${categoryData.id}` 
      : 'http://localhost:3001/api/categories';
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
        throw new Error(responseData.message || `Failed to ${isEditing ? 'update' : 'create'} category`);
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
    if(loading) return;
    onClose();
  };
  
  // Filter out the current category if editing, to prevent self-parenting
  const availableParentCategories = allCategories.filter(cat => !isEditing || cat.id !== categoryData.id);

  return (
    <Dialog open={open} onClose={handleClose} PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
      <DialogTitle>{isEditing ? 'Edit Category' : 'Add New Category'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField autoFocus required margin="dense" id="name" label="Category Name" type="text" fullWidth variant="standard" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
        <FormControl fullWidth margin="dense" variant="standard" required disabled={loading}>
          <InputLabel id="website-select-label">Belongs to Website</InputLabel>
          <Select
            labelId="website-select-label"
            id="website-select"
            value={websiteId}
            onChange={(e) => setWebsiteId(e.target.value)}
            label="Belongs to Website"
          >
            <MenuItem value=""><em>None</em></MenuItem>
            {allWebsites.map((website) => (
              <MenuItem key={website.id} value={website.id}>
                {website.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense" variant="standard" disabled={loading}>
          <InputLabel id="parent-category-select-label">Parent Category (Optional)</InputLabel>
          <Select
            labelId="parent-category-select-label"
            id="parent-category-select"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            label="Parent Category (Optional)"
          >
            <MenuItem value=""><em>None (Top Level Category)</em></MenuItem>
            {availableParentCategories.map((category) => ( // Use filtered list
              <MenuItem key={category.id} value={category.id}>
                {category.name} {category.website ? `(${category.website.name})` : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField margin="dense" id="description" label="Description" type="text" fullWidth multiline rows={2} variant="standard" value={description} onChange={(e) => setDescription(e.target.value)} disabled={loading} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading} color="inherit">Cancel</Button>
        <Button type="submit" disabled={loading} variant="contained">{loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Category')}</Button>
      </DialogActions>
    </Dialog>
  );
};
export default CategoryFormModal;