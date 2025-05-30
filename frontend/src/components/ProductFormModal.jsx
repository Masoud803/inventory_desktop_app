// frontend/src/components/ProductFormModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed

const ProductFormModal = ({ 
    open, 
    onClose, 
    onSave, 
    productData, 
    allWebsites = [], 
    allCategories = [], 
    allSuppliers = [] 
}) => {
  const { token } = useAuth();
  // Product States
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [productType, setProductType] = useState('simple');
  const [basePrice, setBasePrice] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [costOfGoods, setCostOfGoods] = useState('');
  const [websiteId, setWebsiteId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');

  // Variation States
  const [variations, setVariations] = useState([]);
  const [currentVariation, setCurrentVariation] = useState({ attribute_name: '', attribute_value: '', additional_price: '0.00', stock_quantity: '0', sku_suffix: '' });
  const [editingVariationId, setEditingVariationId] = useState(null);

  // Accessory States
  const [accessories, setAccessories] = useState([]);
  const [currentAccessory, setCurrentAccessory] = useState({ name: '', price: '0.00', description: '', stock_impact: '0' });
  const [editingAccessoryId, setEditingAccessoryId] = useState(null);

  const [error, setError] = useState('');
  const [mainFormLoading, setMainFormLoading] = useState(false); // Loading for main product save
  const [itemLoading, setItemLoading] = useState(false); // Loading for variations/accessories add/update/delete

  const isEditing = !!productData;

  // Memoized fetch functions
  const fetchVariations = useCallback(async (pId) => {
    if (!pId || !token) { setVariations([]); return; }
    setItemLoading(true); // Use itemLoading for sub-operations
    try {
      const response = await fetch(`http://localhost:3001/api/products/${pId}/variations`, {
        headers: { 'x-access-token': token },
      });
      if (!response.ok) { const d = await response.json(); throw new Error(d.message || 'Failed to fetch variations');}
      const data = await response.json();
      setVariations(data);
    } catch (err) {
      console.error("Error fetching variations:", err);
      setError("Variations: " + err.message); 
      setVariations([]);
    } finally {
      setItemLoading(false);
    }
  }, [token]);

  const fetchAccessories = useCallback(async (pId) => {
    if (!pId || !token) { setAccessories([]); return; }
    setItemLoading(true); // Use itemLoading
    try {
      const response = await fetch(`http://localhost:3001/api/products/${pId}/accessories`, {
        headers: { 'x-access-token': token },
      });
      if (!response.ok) { const d = await response.json(); throw new Error(d.message || 'Failed to fetch accessories');}
      const data = await response.json();
      setAccessories(data);
    } catch (err) {
      console.error("Error fetching accessories:", err);
      setError("Accessories: " + err.message); 
      setAccessories([]);
    } finally {
      setItemLoading(false);
    }
  }, [token]);
  
  const resetFormStates = useCallback(() => {
    setName(isEditing && productData ? productData.name || '' : '');
    setSku(isEditing && productData ? productData.sku || '' : '');
    setDescription(isEditing && productData ? productData.description || '' : '');
    const initialProductType = isEditing && productData ? productData.product_type || 'simple' : 'simple';
    setProductType(initialProductType);
    setBasePrice(isEditing && productData && productData.base_price !== null ? String(productData.base_price) : '');
    setCurrentStock(isEditing && productData && productData.current_stock !== null ? String(productData.current_stock) : '');
    setCostOfGoods(isEditing && productData && productData.cost_of_goods !== null ? String(productData.cost_of_goods) : '');
    setWebsiteId(isEditing && productData ? productData.website_id || '' : '');
    setCategoryId(isEditing && productData ? productData.category_id || '' : '');
    setSupplierId(isEditing && productData ? productData.supplier_id || '' : '');
    
    if (isEditing && productData && productData.id) {
        if (initialProductType === 'variable') fetchVariations(productData.id); else setVariations([]);
        if (initialProductType === 'customisable') fetchAccessories(productData.id); else setAccessories([]);
    } else {
        setVariations([]);
        setAccessories([]);
    }
    
    setCurrentVariation({ attribute_name: '', attribute_value: '', additional_price: '0.00', stock_quantity: '0', sku_suffix: '' });
    setEditingVariationId(null);
    setCurrentAccessory({ name: '', price: '0.00', description: '', stock_impact: '0' });
    setEditingAccessoryId(null);
    setError('');
  }, [isEditing, productData, fetchVariations, fetchAccessories]);

  useEffect(() => {
    if (open) {
      resetFormStates();
    }
  }, [open, resetFormStates]);


  const handleMainProductSubmit = async (event) => {
    event.preventDefault(); 
    setError('');
    setMainFormLoading(true);

    if (!name || !productType) {
      setError("Product name and type are required.");
      setMainFormLoading(false);
      return;
    }

    const payload = {
      name, sku, description, product_type: productType,
      base_price: basePrice ? parseFloat(basePrice) : null,
      current_stock: productType === 'simple' && currentStock ? parseInt(currentStock) : (isEditing && productData?.current_stock !== undefined ? productData.current_stock : 0),
      cost_of_goods: costOfGoods ? parseFloat(costOfGoods) : null,
      website_id: websiteId || null,
      category_id: categoryId || null,
      supplier_id: supplierId || null,
    };
    
    const endpoint = isEditing 
      ? `http://localhost:3001/api/products/${productData.id}` 
      : 'http://localhost:3001/api/products';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'x-access-token': token },
        body: JSON.stringify(payload),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || `Failed to ${isEditing ? 'update' : 'create'} product`);
      }
      
      onSave(); // This should refetch the product list in ProductsPage
      if (!isEditing) { 
         // If new product is created, and user wants to add var/acc, they can re-open to edit.
         handleClose(); 
      } else {
        // If editing, product details are saved. Variations/accessories lists are managed separately.
        // The onSave in ProductsPage might refetch this specific product data if needed.
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setMainFormLoading(false);
    }
  };

  const handleClose = () => {
    if (mainFormLoading || itemLoading) return; 
    // resetFormStates(); // Called by useEffect on 'open' prop change
    onClose();
  };

  // --- Variation Management Functions ---
  const handleVariationInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentVariation(prev => ({ ...prev, [name]: value }));
  };

  const handleAddOrUpdateVariation = async () => {
    if (!currentVariation.attribute_name || !currentVariation.attribute_value || currentVariation.stock_quantity === '') {
        setError("Variation: Attribute name, value, and stock are required."); return;
    }
    if (!productData || !productData.id) {
        setError("Product must be saved before adding variations."); return;
    }
    setItemLoading(true); setError('');
    const variationPayload = {
        ...currentVariation,
        additional_price: parseFloat(currentVariation.additional_price) || 0,
        stock_quantity: parseInt(currentVariation.stock_quantity) || 0,
    };
    const endpoint = editingVariationId 
        ? `http://localhost:3001/api/variations/${editingVariationId}`
        : `http://localhost:3001/api/products/${productData.id}/variations`;
    const method = editingVariationId ? 'PUT' : 'POST';
    try {
        const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json', 'x-access-token': token }, body: JSON.stringify(variationPayload) });
        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.message || 'Failed to save variation');
        fetchVariations(productData.id); 
        setCurrentVariation({ attribute_name: '', attribute_value: '', additional_price: '0.00', stock_quantity: '0', sku_suffix: '' });
        setEditingVariationId(null);
    } catch (err) { setError(err.message); } finally { setItemLoading(false); }
  };
  
  const handleEditVariation = (variation) => {
    setCurrentVariation({
        attribute_name: variation.attribute_name || '',
        attribute_value: variation.attribute_value || '',
        additional_price: String(variation.additional_price || '0.00'),
        stock_quantity: String(variation.stock_quantity || '0'),
        sku_suffix: variation.sku_suffix || ''
    });
    setEditingVariationId(variation.id);
  };

  const handleDeleteVariation = async (variationId) => {
    if (!window.confirm("Delete this variation?")) return;
    if (!productData || !productData.id) return;
    setItemLoading(true); setError('');
    try {
        const response = await fetch(`http://localhost:3001/api/variations/${variationId}`, { method: 'DELETE', headers: { 'x-access-token': token }});
        if (!response.ok) { const d = await response.json(); throw new Error(d.message || 'Failed to delete variation');}
        fetchVariations(productData.id); 
    } catch (err) { setError(err.message); } finally { setItemLoading(false); }
  };

  // --- Accessory Management Functions ---
  const handleAccessoryInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentAccessory(prev => ({ ...prev, [name]: value }));
  };

  const handleAddOrUpdateAccessory = async () => {
    if (!currentAccessory.name || currentAccessory.price === '') {
        setError("Accessory: Name and price are required."); return;
    }
    if (!productData || !productData.id) {
        setError("Product must be saved before adding accessories."); return;
    }
    setItemLoading(true); setError('');
    const accessoryPayload = {
        ...currentAccessory,
        price: parseFloat(currentAccessory.price) || 0,
        stock_impact: parseInt(currentAccessory.stock_impact) || 0,
    };
    const endpoint = editingAccessoryId
        ? `http://localhost:3001/api/accessories/${editingAccessoryId}`
        : `http://localhost:3001/api/products/${productData.id}/accessories`;
    const method = editingAccessoryId ? 'PUT' : 'POST';
    try {
        const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json', 'x-access-token': token }, body: JSON.stringify(accessoryPayload) });
        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.message || 'Failed to save accessory');
        fetchAccessories(productData.id); 
        setCurrentAccessory({ name: '', price: '0.00', description: '', stock_impact: '0' });
        setEditingAccessoryId(null);
    } catch (err) { setError(err.message); } finally { setItemLoading(false); }
  };

  const handleEditAccessory = (accessory) => {
    setCurrentAccessory({
        name: accessory.name || '',
        description: accessory.description || '',
        price: String(accessory.price || '0.00'),
        stock_impact: String(accessory.stock_impact || '0')
    });
    setEditingAccessoryId(accessory.id);
  };

  const handleDeleteAccessory = async (accessoryId) => {
    if (!window.confirm("Delete this accessory?")) return;
    if (!productData || !productData.id) return;
    setItemLoading(true); setError('');
    try {
        const response = await fetch(`http://localhost:3001/api/accessories/${accessoryId}`, { method: 'DELETE', headers: { 'x-access-token': token }});
        if (!response.ok) { const d = await response.json(); throw new Error(d.message || 'Failed to delete accessory');}
        fetchAccessories(productData.id);
    } catch (err) { setError(err.message); } finally { setItemLoading(false); }
  };

  return (
    <Dialog 
        open={open} 
        onClose={handleClose} 
        PaperProps={{ component: 'form', onSubmit: handleMainProductSubmit }} // Main form for product details
        maxWidth="md" 
        fullWidth
    >
      <DialogTitle>{isEditing ? `Edit Product: ${productData?.name || '...'}` : 'Add New Product'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        <Typography variant="h6" sx={{mt:1}}>Product Details</Typography>
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField autoFocus={!isEditing} required margin="dense" id="name" label="Product Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} disabled={mainFormLoading} /></Grid>
            <Grid item xs={12} sm={6}><TextField margin="dense" id="sku" label="SKU" fullWidth value={sku} onChange={(e) => setSku(e.target.value)} disabled={mainFormLoading} /></Grid>
            <Grid item xs={12}><TextField margin="dense" id="description" label="Description" fullWidth multiline rows={3} value={description} onChange={(e) => setDescription(e.target.value)} disabled={mainFormLoading} /></Grid>
            <Grid item xs={12} sm={4}>
                <FormControl fullWidth margin="dense" required disabled={mainFormLoading || isEditing}>
                    <InputLabel>Product Type</InputLabel>
                    <Select value={productType} label="Product Type" onChange={(e) => { setProductType(e.target.value); /* Reset sub-items if type changes when not editing */ if (!isEditing) { setVariations([]); setAccessories([]);} } }>
                        <MenuItem value="simple">Simple</MenuItem>
                        <MenuItem value="variable">Variable</MenuItem>
                        <MenuItem value="customisable">Customisable</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}><TextField margin="dense" id="basePrice" label="Base Price (Rs.)" type="number" fullWidth value={basePrice} onChange={(e) => setBasePrice(e.target.value)} disabled={mainFormLoading} InputProps={{ inputProps: { step: "0.01" } }} /></Grid>
            {productType === 'simple' && (<Grid item xs={12} sm={4}><TextField margin="dense" id="currentStock" label="Current Stock" type="number" fullWidth value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} disabled={mainFormLoading} /></Grid>)}
            <Grid item xs={12} sm={4}><TextField margin="dense" id="costOfGoods" label="Cost of Goods (Rs.)" type="number" fullWidth value={costOfGoods} onChange={(e) => setCostOfGoods(e.target.value)} disabled={mainFormLoading} InputProps={{ inputProps: { step: "0.01" } }} /></Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth margin="dense" disabled={mainFormLoading}>
                <InputLabel id="website-select-label-product">Website</InputLabel>
                <Select labelId="website-select-label-product" value={websiteId} label="Website" onChange={(e) => setWebsiteId(e.target.value)}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {allWebsites.map((ws) => (<MenuItem key={ws.id} value={ws.id}>{ws.name}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth margin="dense" disabled={mainFormLoading}>
                <InputLabel id="category-select-label-product">Category</InputLabel>
                <Select labelId="category-select-label-product" value={categoryId} label="Category" onChange={(e) => setCategoryId(e.target.value)}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {allCategories.map((cat) => (<MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth margin="dense" disabled={mainFormLoading}>
                <InputLabel id="supplier-select-label-product">Supplier</InputLabel>
                <Select labelId="supplier-select-label-product" value={supplierId} label="Supplier" onChange={(e) => setSupplierId(e.target.value)}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {allSuppliers.map((sup) => (<MenuItem key={sup.id} value={sup.id}>{sup.name}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
        </Grid>

        {/* --- Variations Section --- */}
        {isEditing && productType === 'variable' && productData?.id && (
          <Box component={Paper} sx={{ p: 2, mt: 3 }} elevation={2}>
            <Typography variant="h6" gutterBottom>Manage Variations</Typography>
            <Box sx={{display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap:'wrap', mb:2}}>
              <TextField label="Attribute Name" name="attribute_name" value={currentVariation.attribute_name} onChange={handleVariationInputChange} size="small" disabled={itemLoading} sx={{flexGrow:1, minWidth: '120px'}}/>
              <TextField label="Attribute Value" name="attribute_value" value={currentVariation.attribute_value} onChange={handleVariationInputChange} size="small" disabled={itemLoading} sx={{flexGrow:1, minWidth: '120px'}}/>
              <TextField label="Additional Price" name="additional_price" type="number" value={currentVariation.additional_price} onChange={handleVariationInputChange} size="small" InputProps={{ inputProps: { step: "0.01" } }} disabled={itemLoading} sx={{width: '130px'}}/>
              <TextField label="Stock" name="stock_quantity" type="number" value={currentVariation.stock_quantity} onChange={handleVariationInputChange} size="small" disabled={itemLoading} sx={{width: '100px'}}/>
              <TextField label="SKU Suffix" name="sku_suffix" value={currentVariation.sku_suffix} onChange={handleVariationInputChange} size="small" disabled={itemLoading} sx={{flexGrow:1, minWidth: '100px'}}/>
              <Button type="button" variant="outlined" size="medium" onClick={handleAddOrUpdateVariation} disabled={itemLoading || !productData?.id} sx={{height: '40px'}}>
                {editingVariationId ? 'Update Var.' : 'Add Var.'}
              </Button>
            </Box>
            <List dense>
              {variations.map(v => ( 
                 <ListItem key={v.id} disablePadding sx={{mb:0.5, borderBottom: '1px solid #eee'}}
                    secondaryAction={ <>
                    <IconButton edge="end" aria-label="edit" onClick={() => handleEditVariation(v)} size="small" disabled={itemLoading} sx={{mr:0.5}}><EditIcon fontSize="small"/></IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteVariation(v.id)} size="small" disabled={itemLoading}><DeleteIcon fontSize="small"/></IconButton>
                  </>}>
                  <ListItemText 
                    primary={`${v.attribute_name}: ${v.attribute_value}`} 
                    secondary={`Price Adj: ${v.additional_price || 0}, Stock: ${v.stock_quantity || 0}, SKU Suffix: ${v.sku_suffix || '-'}`} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* --- Accessories Section --- */}
        {isEditing && productType === 'customisable' && productData?.id && (
          <Box component={Paper} sx={{ p: 2, mt: 3 }} elevation={2}>
            <Typography variant="h6" gutterBottom>Manage Accessories</Typography>
            <Box sx={{display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap:'wrap', mb:2}}>
              <TextField label="Accessory Name" name="name" value={currentAccessory.name} onChange={handleAccessoryInputChange} size="small" disabled={itemLoading} sx={{flexGrow:1, minWidth: '150px'}}/>
              <TextField label="Price" name="price" type="number" value={currentAccessory.price} onChange={handleAccessoryInputChange} size="small" InputProps={{ inputProps: { step: "0.01" } }} disabled={itemLoading} sx={{width: '120px'}}/>
              <TextField label="Description" name="description" value={currentAccessory.description} onChange={handleAccessoryInputChange} size="small" multiline maxRows={1} sx={{flexGrow:2, minWidth: '150px'}}/>
              <TextField label="Stock Impact" name="stock_impact" type="number" value={currentAccessory.stock_impact} onChange={handleAccessoryInputChange} size="small" disabled={itemLoading} sx={{width: '120px'}}/>
              <Button type="button" variant="outlined" size="medium" onClick={handleAddOrUpdateAccessory} disabled={itemLoading || !productData?.id} sx={{height: '40px'}}>
                {editingAccessoryId ? 'Update Acc.' : 'Add Acc.'}
              </Button>
            </Box>
            <List dense>
              {accessories.map(acc => (  
                <ListItem key={acc.id} disablePadding sx={{mb:0.5, borderBottom: '1px solid #eee'}}
                    secondaryAction={ <>
                    <IconButton edge="end" aria-label="edit" onClick={() => handleEditAccessory(acc)} size="small" disabled={itemLoading} sx={{mr:0.5}}><EditIcon fontSize="small"/></IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteAccessory(acc.id)} size="small" disabled={itemLoading}><DeleteIcon fontSize="small"/></IconButton>
                  </>}>
                  <ListItemText 
                    primary={acc.name} 
                    secondary={`Price: ${acc.price || 0}, Stock Impact: ${acc.stock_impact || 0}, Desc: ${acc.description || '-'}`} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

      </DialogContent>
      <DialogActions sx={{p: '16px 24px'}}>
        <Button onClick={handleClose} disabled={mainFormLoading || itemLoading} color="inherit">Cancel</Button>
        <Button 
            onClick={handleMainProductSubmit} 
            disabled={mainFormLoading || itemLoading} 
            variant="contained"
            color="primary"
        > 
          {mainFormLoading ? <CircularProgress size={24} color="inherit"/> : (isEditing ? 'Save Product Changes' : 'Add Product')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default ProductFormModal;