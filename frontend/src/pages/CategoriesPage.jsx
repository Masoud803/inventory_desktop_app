// frontend/src/pages/CategoriesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button'; // Ensure Button is imported
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
import { useAuth } from '../contexts/AuthContext';
import CategoryFormModal from '../components/CategoryFormModal';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [allWebsites, setAllWebsites] = useState([]);
  const [error, setError] = useState('');
  const { token, user } = useAuth();

  const [openCategoryModal, setOpenCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = useCallback(async () => { /* ... (same as before) ... */
    setError('');
    if (!token) { setError("Authentication token not found. Please login again."); setCategories([]); return; }
    try {
      const response = await fetch('http://localhost:3001/api/categories', { headers: { 'x-access-token': token }});
      if (!response.ok) { const errData = await response.json(); throw new Error(errData.message || 'Failed to fetch categories');}
      const data = await response.json();
      setCategories(data);
    } catch (err) { setError(err.message); setCategories([]); }
  }, [token]);
  
  const fetchAllWebsitesForDropdown = useCallback(async () => { /* ... (same as before) ... */
    if (!token) return;
    try {
      const response = await fetch('http://localhost:3001/api/websites', { headers: { 'x-access-token': token }});
      if (!response.ok) { console.error('Failed to fetch websites for category form'); setAllWebsites([]); return; }
      const data = await response.json();
      setAllWebsites(data);
    } catch (err) { console.error("Error fetching websites for dropdown:", err); setAllWebsites([]); }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchCategories();
      fetchAllWebsitesForDropdown();
    } else {
      setCategories([]); setAllWebsites([]); setError("Please login to view categories.");
    }
  }, [token, fetchCategories, fetchAllWebsitesForDropdown]);

  const handleOpenAddModal = () => { setEditingCategory(null); setOpenCategoryModal(true); };
  const handleOpenEditModal = (category) => { setEditingCategory(category); setOpenCategoryModal(true); };
  const handleCloseModal = () => { setOpenCategoryModal(false); setEditingCategory(null); };
  const handleSaveCategory = () => { fetchCategories(); };
  const handleDeleteCategory = async (categoryId) => { /* ... (same as before) ... */
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    setError('');
    try {
      const response = await fetch(`http://localhost:3001/api/categories/${categoryId}`, { method: 'DELETE', headers: { 'x-access-token': token }});
      if (!response.ok) { const errData = await response.json(); throw new Error(errData.message || 'Failed to delete category'); }
      fetchCategories();
    } catch (err) { setError(err.message); }
  };
  
  // Updated Permissions
  const canUserCreateUpdate = user && (user.role === 'user' || user.role === 'admin' || user.role === 'super_admin');
  const canUserDelete = user && (user.role === 'admin' || user.role === 'super_admin');

  const renderCategoryRows = (categoryList, level = 0) => { /* ... (same as before, but ensure Edit button uses canUserCreateUpdate) ... */
    let rows = [];
    categoryList.forEach(category => {
      rows.push(
        <TableRow key={category.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
          <TableCell sx={{ paddingLeft: `${(level * 20) + 16}px` }}>{category.name}</TableCell>
          <TableCell>{category.website?.name || 'N/A'}</TableCell>
          <TableCell>{category.parentCategory?.name || '-'}</TableCell>
          <TableCell>{category.description || '-'}</TableCell>
          <TableCell align="right">
            {canUserCreateUpdate && ( // <<--- Users can now see Edit
              <IconButton onClick={() => handleOpenEditModal(category)} color="primary" title="Edit Category">
                <EditIcon />
              </IconButton>
            )}
            {canUserDelete && ( // Delete only for Admin/SuperAdmin
              <IconButton onClick={() => handleDeleteCategory(category.id)} color="error" title="Delete Category">
                <DeleteIcon />
              </IconButton>
            )}
          </TableCell>
        </TableRow>
      );
      if (category.subCategories && category.subCategories.length > 0) {
        rows = rows.concat(renderCategoryRows(category.subCategories, level + 1));
      }
    });
    return rows;
  };
  
  const topLevelCategories = categories.filter(cat => !cat.parent_id && !cat.parentCategory);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>Categories Management</Typography>
         {canUserCreateUpdate && ( // <<--- Users can now see Add button
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenAddModal}>
            Add Category
          </Button>
        )}
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 650 }} aria-label="categories table">
          <TableHead sx={{ backgroundColor: (theme) => theme.palette.grey[200] }}>
            {/* ... (Table Head content same as before) ... */}
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Category Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Website</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Parent Category</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* ... (No categories found message - same as before) ... */}
            {categories.length === 0 && !error && (
              <TableRow><TableCell colSpan={5} align="center">No categories found.</TableCell></TableRow>
            )}
            {renderCategoryRows(topLevelCategories)}
          </TableBody>
        </Table>
      </TableContainer>

      {openCategoryModal && (
        <CategoryFormModal
          open={openCategoryModal}
          onClose={handleCloseModal}
          onSave={handleSaveCategory}
          categoryData={editingCategory}
          allWebsites={allWebsites}
          allCategories={categories} 
        />
      )}
    </Box>
  );
};
export default CategoriesPage;