// frontend/src/pages/ProductsPage.jsx
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
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest'; // For Variations/Accessories
import Alert from '@mui/material/Alert';
import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed
import ProductFormModal from '../components/ProductFormModal';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const { token, user } = useAuth();

  const [openProductModal, setOpenProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // For dropdowns in ProductFormModal
  const [allWebsites, setAllWebsites] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);

  const fetchDataForForm = useCallback(async () => {
    if (!token) return;
    try {
      // Fetch Websites
      const webRes = await fetch('http://localhost:3001/api/websites', { headers: { 'x-access-token': token } });
      if (webRes.ok) setAllWebsites(await webRes.json()); else console.error("Failed to fetch websites");
      
      // Fetch Categories
      const catRes = await fetch('http://localhost:3001/api/categories', { headers: { 'x-access-token': token } });
      if (catRes.ok) setAllCategories(await catRes.json()); else console.error("Failed to fetch categories");

      // Fetch Suppliers
      const supRes = await fetch('http://localhost:3001/api/suppliers', { headers: { 'x-access-token': token } });
      if (supRes.ok) setAllSuppliers(await supRes.json()); else console.error("Failed to fetch suppliers");

    } catch (err) {
      console.error("Error fetching data for product form:", err);
    }
  }, [token]);


  const fetchProducts = useCallback(async () => { /* ... (same as before) ... */
    setError('');
    if (!token) { setError("Auth token not found."); setProducts([]); return; }
    try {
      const response = await fetch('http://localhost:3001/api/products', { headers: { 'x-access-token': token }});
      if (!response.ok) { const errData = await response.json(); throw new Error(errData.message || 'Failed to fetch products'); }
      const data = await response.json();
      setProducts(data);
    } catch (err) { setError(err.message); setProducts([]); }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchDataForForm(); // Fetch data for dropdowns
    }
  }, [token, fetchProducts, fetchDataForForm]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setOpenProductModal(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setOpenProductModal(true);
  };

  const handleCloseModal = () => {
    setOpenProductModal(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = () => {
    fetchProducts(); // Refresh list
  };

  const handleDeleteProduct = async (productId) => { /* ... (same as before) ... */
     if (!window.confirm("Are you sure you want to delete this product?")) return;
    setError('');
    try {
      const response = await fetch(`http://localhost:3001/api/products/${productId}`, { method: 'DELETE', headers: { 'x-access-token': token }});
      if (!response.ok) { const errData = await response.json(); throw new Error(errData.message || 'Failed to delete product'); }
      fetchProducts(); 
    } catch (err) { setError(err.message); }
  };
  
  const handleManageVariationsAccessories = (product) => {
    setEditingProduct(product); // Open the main product modal
    setOpenProductModal(true);  // Where we'll add tabs/sections for variations/accessories
    console.log("Manage variations/accessories for:", product.name);
  };
  
  const canUserCreateUpdate = user && (user.role === 'user' || user.role === 'admin' || user.role === 'super_admin');
  const canUserDelete = user && (user.role === 'admin' || user.role === 'super_admin');

  return (
    <Box sx={{ p: 3 }}>
      {/* ... (Box for Typography and Add Button - same as before) ... */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>Products Management</Typography>
        {canUserCreateUpdate && (
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenAddModal}>Add Product</Button>
        )}
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TableContainer component={Paper} elevation={3}>
        {/* ... (Table structure and rendering - same as before, can add more columns like Website, Category, Supplier names from product.website.name etc.) ... */}
        <Table sx={{ minWidth: 650 }} aria-label="products table">
          <TableHead sx={{ backgroundColor: (theme) => theme.palette.grey[200] }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>SKU</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Website</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Supplier</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Base Price</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Stock</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.length === 0 && !error && (
              <TableRow><TableCell colSpan={9} align="center">No products found.</TableCell></TableRow>
            )}
            {products.map((product) => (
              <TableRow key={product.id} hover>
                <TableCell component="th" scope="row">{product.name}</TableCell>
                <TableCell>{product.sku || '-'}</TableCell>
                <TableCell>{product.product_type?.toUpperCase()}</TableCell>
                <TableCell>{product.website?.name || '-'}</TableCell>
                <TableCell>{product.category?.name || '-'}</TableCell>
                <TableCell>{product.supplier?.name || '-'}</TableCell>
                <TableCell>{product.base_price !== null ? `Rs. ${product.base_price}` : '-'}</TableCell>
                <TableCell>{product.product_type === 'simple' ? (product.current_stock !== null ? product.current_stock : '-') : 'Manage Stock via Variations/Type'}</TableCell>
                <TableCell align="right">
                  {(product.product_type === 'variable' || product.product_type === 'customisable') && canUserCreateUpdate && (
                     <IconButton onClick={() => handleManageVariationsAccessories(product)} color="secondary" title="Manage Variations/Accessories"><SettingsSuggestIcon /></IconButton>
                  )}
                  {canUserCreateUpdate && (
                    <IconButton onClick={() => handleOpenEditModal(product)} color="primary" title="Edit Product"><EditIcon /></IconButton>
                  )}
                  {canUserDelete && (
                    <IconButton onClick={() => handleDeleteProduct(product.id)} color="error" title="Delete Product"><DeleteIcon /></IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {openProductModal && (
        <ProductFormModal 
          open={openProductModal} 
          onClose={handleCloseModal}
          onSave={handleSaveProduct}
          productData={editingProduct}
          allWebsites={allWebsites}
          allCategories={allCategories}
          allSuppliers={allSuppliers}
        />
      )}
    </Box>
  );
};
export default ProductsPage;