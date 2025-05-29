// frontend/src/pages/StockPage.jsx
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
import TextField from '@mui/material/TextField'; // Still used for Date filters
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed
import StockAdjustmentModal from '../components/StockAdjustmentModal'; // Adjust path if needed

const StockPage = () => {
  const [stockMovements, setStockMovements] = useState([]);
  const [filters, setFilters] = useState({
    productId: '',      
    variationId: '',    
    accessoryId: '',    
    movementType: '',
    userId: '',         
    startDate: '',
    endDate: ''
  });

  // State for dropdown options
  const [productsForFilter, setProductsForFilter] = useState([]);
  const [usersForFilter, setUsersForFilter] = useState([]);
  const [variationsForFilter, setVariationsForFilter] = useState([]); // For dynamic variation dropdown
  const [accessoriesForFilter, setAccessoriesForFilter] = useState([]); // For dynamic accessory dropdown

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // For main movements list
  const [loadingSubFilterItems, setLoadingSubFilterItems] = useState(false); // For variations/accessories dropdowns
  const { token, user } = useAuth(); 

  const [openAdjustmentModal, setOpenAdjustmentModal] = useState(false);

  // Fetch data for initial filter dropdowns (Products and Users)
  const fetchFilterDropdownData = useCallback(async () => {
    if (!token) return;
    // No separate loading state here, main loading state will cover initial load
    try {
      const headers = { 'x-access-token': token };
      const [prodRes, userRes] = await Promise.all([
        fetch('http://localhost:3001/api/products', { headers }),
        user && (user.role === 'admin' || user.role === 'super_admin')
          ? fetch('http://localhost:3001/api/users', { headers })
          : Promise.resolve({ ok: true, json: async () => [] }) // Resolve with empty if not admin
      ]);
      
      const productData = prodRes.ok ? await prodRes.json() : [];
      setProductsForFilter(Array.isArray(productData) ? productData : []);

      const usersData = userRes.ok ? await userRes.json() : [];
      setUsersForFilter(Array.isArray(usersData) ? usersData : []);

    } catch (err) {
      console.error("Failed to fetch data for filters:", err);
      // setError("Could not load filter options."); // Can be less intrusive for dropdown data
      setProductsForFilter([]);
      setUsersForFilter([]);
    }
  }, [token, user]);

  // Fetch variations for the selected product in filter
  const fetchVariationsForFilterDropdown = useCallback(async (productId) => {
    if (!productId || !token) { setVariationsForFilter([]); return; }
    setLoadingSubFilterItems(true);
    try {
      const response = await fetch(`http://localhost:3001/api/products/${productId}/variations`, { headers: { 'x-access-token': token } });
      const data = response.ok ? await response.json() : [];
      setVariationsForFilter(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Error fetching variations for filter:", err); setVariationsForFilter([]);}
    finally { setLoadingSubFilterItems(false); }
  }, [token]);

  // Fetch accessories for the selected product in filter
  const fetchAccessoriesForFilterDropdown = useCallback(async (productId) => {
    if (!productId || !token) { setAccessoriesForFilter([]); return; }
    setLoadingSubFilterItems(true);
    try {
      const response = await fetch(`http://localhost:3001/api/products/${productId}/accessories`, { headers: { 'x-access-token': token } });
      const data = response.ok ? await response.json() : [];
      setAccessoriesForFilter(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Error fetching accessories for filter:", err); setAccessoriesForFilter([]);}
    finally { setLoadingSubFilterItems(false); }
  }, [token]);
  
  const fetchStockMovements = useCallback(async () => {
    if (!token) {
      setError("Please login to view stock movements.");
      setStockMovements([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    
    const queryParams = new URLSearchParams();
    if (filters.productId) queryParams.append('productId', filters.productId);
    if (filters.variationId) queryParams.append('variationId', filters.variationId);
    if (filters.accessoryId) queryParams.append('accessoryId', filters.accessoryId);
    if (filters.movementType) queryParams.append('movementType', filters.movementType);
    if (filters.userId) queryParams.append('userId', filters.userId);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    
    const endpoint = `http://localhost:3001/api/stock/movements?${queryParams.toString()}`;

    try {
      const response = await fetch(endpoint, { headers: { 'x-access-token': token }});
      const responseData = await response.json(); // <<--- Call .json() only ONCE here

      if (!response.ok) {
        throw new Error(responseData.message || `Failed to fetch stock movements (Status: ${response.status})`);
      }
      setStockMovements(Array.isArray(responseData) ? responseData : []);

    } catch (err) { 
      console.error("Error in fetchStockMovements:", err);
      setError(err.message); 
      setStockMovements([]); 
    } 
    finally { setLoading(false); }
  }, [token, filters]);

  useEffect(() => {
    if (token) {
      fetchFilterDropdownData();
      // fetchStockMovements will be called via the filters dependency in its own useEffect
    }
  }, [token, fetchFilterDropdownData]);

  useEffect(() => {
    if (token) { 
        fetchStockMovements();
    }
  }, [token, filters, fetchStockMovements]);
  
  useEffect(() => {
    if (filters.productId) {
      const selectedProduct = productsForFilter.find(p => p.id === parseInt(filters.productId));
      if (selectedProduct) {
        if (selectedProduct.product_type === 'variable') {
          fetchVariationsForFilterDropdown(filters.productId);
          setAccessoriesForFilter([]); 
        } else if (selectedProduct.product_type === 'customisable') {
          fetchAccessoriesForFilterDropdown(filters.productId);
          setVariationsForFilter([]); 
        } else { 
          setVariationsForFilter([]);
          setAccessoriesForFilter([]);
        }
      } else { // Product might not be in the list yet if list is loading
        setVariationsForFilter([]);
        setAccessoriesForFilter([]);
      }
    } else { 
      setVariationsForFilter([]);
      setAccessoriesForFilter([]);
    }
  }, [filters.productId, productsForFilter, fetchVariationsForFilterDropdown, fetchAccessoriesForFilterDropdown, token]);


  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters, [name]: value };
      if (name === 'productId') {
        newFilters.variationId = '';
        newFilters.accessoryId = '';
      }
      return newFilters;
    });
  };

  const handleApplyFilters = () => { fetchStockMovements(); };
  const handleClearFilters = () => { setFilters({ productId: '', variationId: '', accessoryId: '', movementType: '', userId: '', startDate: '', endDate: ''}); };
  const handleOpenAdjustmentModal = () => { setOpenAdjustmentModal(true); };
  const handleCloseAdjustmentModal = () => { setOpenAdjustmentModal(false); };
  const handleSaveAdjustment = () => { fetchStockMovements(); };
  const canUserAdjustStock = user && (user.role === 'admin' || user.role === 'super_admin');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>Stock Movements Log</Typography>
        {canUserAdjustStock && ( <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={handleOpenAdjustmentModal}> Manual Stock Adjustment </Button> )}
      </Box>

      <Paper sx={{ p: 2, mb: 3 }} elevation={2}>
        <Typography variant="h6" gutterBottom>Filters</Typography>
        <Grid container spacing={2} alignItems="center"> {/* Changed to center for better button alignment on smaller filter rows */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small" variant="outlined" disabled={loading}>
              <InputLabel id="product-filter-label">Product</InputLabel>
              <Select labelId="product-filter-label" name="productId" value={filters.productId} onChange={handleFilterChange} label="Product">
                <MenuItem value=""><em>All Products</em></MenuItem>
                {productsForFilter.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small" variant="outlined" disabled={!filters.productId || variationsForFilter.length === 0 || loadingSubFilterItems || loading}>
              <InputLabel id="variation-filter-label">Variation</InputLabel>
              <Select labelId="variation-filter-label" name="variationId" value={filters.variationId} onChange={handleFilterChange} label="Variation">
                <MenuItem value=""><em>All Variations</em></MenuItem>
                {variationsForFilter.map(v => <MenuItem key={v.id} value={v.id}>{`${v.attribute_name}: ${v.attribute_value}`}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
             <FormControl fullWidth size="small" variant="outlined" disabled={!filters.productId || accessoriesForFilter.length === 0 || loadingSubFilterItems || loading}>
              <InputLabel id="accessory-filter-label">Accessory</InputLabel>
              <Select labelId="accessory-filter-label" name="accessoryId" value={filters.accessoryId} onChange={handleFilterChange} label="Accessory">
                <MenuItem value=""><em>All Accessories</em></MenuItem>
                {accessoriesForFilter.map(acc => <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
             <FormControl fullWidth size="small" variant="outlined" disabled={loading}>
              <InputLabel id="movetype-filter-label">Movement Type</InputLabel>
              <Select labelId="movetype-filter-label" name="movementType" value={filters.movementType} onChange={handleFilterChange} label="Movement Type">
                <MenuItem value=""><em>All Types</em></MenuItem>
                <MenuItem value="initial_stock">Initial Stock (Product)</MenuItem>
                <MenuItem value="initial_stock_var">Initial Stock (Variation)</MenuItem>
                <MenuItem value="initial_stock_acc">Initial Stock (Accessory)</MenuItem>
                <MenuItem value="adjustment_in">Adj. IN (Product)</MenuItem>
                <MenuItem value="adjustment_out">Adj. OUT (Product)</MenuItem>
                <MenuItem value="adjustment_in_var">Adj. IN (Variation)</MenuItem>
                <MenuItem value="adjustment_out_var">Adj. OUT (Variation)</MenuItem>
                <MenuItem value="adjustment_in_acc">Adj. IN (Accessory)</MenuItem>
                <MenuItem value="adjustment_out_acc">Adj. OUT (Accessory)</MenuItem>
                <MenuItem value="damaged">Damaged</MenuItem>
                <MenuItem value="sale">Sale</MenuItem>
                <MenuItem value="return_customer">Customer Return</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {canUserAdjustStock && (
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small" variant="outlined" disabled={loading}>
              <InputLabel id="user-filter-label">User (Adjuster)</InputLabel>
              <Select labelId="user-filter-label" name="userId" value={filters.userId} onChange={handleFilterChange} label="User (Adjuster)">
                <MenuItem value=""><em>All Users</em></MenuItem>
                {usersForFilter.map(u => <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          )}
          <Grid item xs={12} sm={4} md={1}><TextField label="Start Date" name="startDate" type="date" value={filters.startDate} onChange={handleFilterChange} fullWidth size="small" variant="outlined" InputLabelProps={{ shrink: true }} disabled={loading}/></Grid>
          <Grid item xs={12} sm={4} md={1}><TextField label="End Date" name="endDate" type="date" value={filters.endDate} onChange={handleFilterChange} fullWidth size="small" variant="outlined" InputLabelProps={{ shrink: true }} disabled={loading}/></Grid>
          <Grid item xs={12} sm={4} md={2} display="flex" justifyContent="flex-end" alignItems="center" gap={1}>
            <Button onClick={handleClearFilters} size="medium" variant="outlined" disabled={loading}>Clear</Button>
            <Button onClick={handleApplyFilters} variant="contained" size="medium" disabled={loading}>Apply Filters</Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      
      {loading ? ( <Box sx={{display: 'flex', justifyContent: 'center', my: 3}}><CircularProgress /><Typography sx={{ml:1}}>Loading movements...</Typography></Box> ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table sx={{ minWidth: 750 }} aria-label="stock movements table">
            <TableHead sx={{ backgroundColor: (theme) => theme.palette.grey[200] }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Item Details</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Movement Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Qty Changed</TableCell>
                <TableCell sx={{ fontWeight: 'bold', maxWidth: 150 }}>Remarks</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stockMovements.length === 0 && !error && ( <TableRow><TableCell colSpan={6} align="center">No stock movements found for the selected criteria.</TableCell></TableRow> )}
              {stockMovements.map((move) => (
                <TableRow key={move.id} hover>
                  <TableCell>{new Date(move.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    {move.product && !move.variationId && !move.accessoryId && `Product: ${move.product.name} (SKU: ${move.product.sku || 'N/A'})`}
                    {move.variation && `Variation: ${move.variation.attribute_name || 'N/A'}: ${move.variation.attribute_value || 'N/A'} (of Prod. ID: ${move.product_id || move.variation.product_id})`}
                    {move.accessory && `Accessory: ${move.accessory.name || 'N/A'} (for Prod. ID: ${move.product_id || move.accessory.product_id})`}
                  </TableCell>
                  <TableCell>{move.movement_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableCell>
                  <TableCell align="right" sx={{ color: move.quantity_changed < 0 ? 'error.main' : 'success.main', fontWeight: 'bold' }}>
                    {move.quantity_changed > 0 ? `+${move.quantity_changed}` : move.quantity_changed}
                  </TableCell>
                  <TableCell sx={{maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={move.remarks || ''}>{move.remarks || '-'}</TableCell>
                  <TableCell>{move.user ? move.user.username : (move.user_id || 'System')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {openAdjustmentModal && canUserAdjustStock && (
        <StockAdjustmentModal
          open={openAdjustmentModal}
          onClose={handleCloseAdjustmentModal}
          onSave={handleSaveAdjustment}
        />
      )}
    </Box>
  );
};
export default StockPage;




// // frontend/src/pages/StockPage.jsx
// import React, { useState, useEffect, useCallback } from 'react';
// import Box from '@mui/material/Box';
// import Typography from '@mui/material/Typography';
// import Button from '@mui/material/Button';
// import AddIcon from '@mui/icons-material/Add';
// import Paper from '@mui/material/Paper';
// import Table from '@mui/material/Table';
// import TableBody from '@mui/material/TableBody';
// import TableCell from '@mui/material/TableCell';
// import TableContainer from '@mui/material/TableContainer';
// import TableHead from '@mui/material/TableHead';
// import TableRow from '@mui/material/TableRow';
// import TextField from '@mui/material/TextField'; // Still used for Date filters
// import Grid from '@mui/material/Grid';
// import Alert from '@mui/material/Alert';
// import CircularProgress from '@mui/material/CircularProgress';
// import FormControl from '@mui/material/FormControl';
// import InputLabel from '@mui/material/InputLabel';
// import Select from '@mui/material/Select';
// import MenuItem from '@mui/material/MenuItem';
// import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed
// import StockAdjustmentModal from '../components/StockAdjustmentModal'; // Adjust path if needed

// const StockPage = () => {
//   const [stockMovements, setStockMovements] = useState([]);
//   const [filters, setFilters] = useState({
//     productId: '',      
//     variationId: '',    
//     accessoryId: '',    
//     movementType: '',
//     userId: '',         
//     startDate: '',
//     endDate: ''
//   });

//   // State for dropdown options
//   const [productsForFilter, setProductsForFilter] = useState([]);
//   const [usersForFilter, setUsersForFilter] = useState([]);
//   const [variationsForFilter, setVariationsForFilter] = useState([]); // For dynamic variation dropdown
//   const [accessoriesForFilter, setAccessoriesForFilter] = useState([]); // For dynamic accessory dropdown

//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(true); // For main movements list
//   const [loadingSubItems, setLoadingSubItems] = useState(false); // For variations/accessories dropdowns
//   const { token, user } = useAuth(); 

//   const [openAdjustmentModal, setOpenAdjustmentModal] = useState(false);

//   // Fetch data for initial filter dropdowns (Products and Users)
//   const fetchFilterDropdownData = useCallback(async () => {
//     if (!token) return;
//     setLoading(true); // Combined loading for initial data
//     try {
//       const headers = { 'x-access-token': token };
//       const [prodRes, userRes] = await Promise.all([
//         fetch('http://localhost:3001/api/products', { headers }),
//         fetch('http://localhost:3001/api/users', { headers }) // Assuming admins can see users
//       ]);
      
//       const productData = prodRes.ok ? await prodRes.json() : [];
//       setProductsForFilter(Array.isArray(productData) ? productData : []);

//       if (user && (user.role === 'admin' || user.role === 'super_admin')) {
//         const usersData = userRes.ok ? await userRes.json() : [];
//         setUsersForFilter(Array.isArray(usersData) ? usersData : []);
//       } else {
//         setUsersForFilter([]);
//       }
//     } catch (err) {
//       console.error("Failed to fetch data for filters:", err);
//       setError("Could not load filter options.");
//       setProductsForFilter([]);
//       setUsersForFilter([]);
//     } finally {
//         // Loading for movements will be handled by fetchStockMovements
//     }
//   }, [token, user]);

//   // Fetch variations for the selected product in filter
//   const fetchVariationsForFilterDropdown = useCallback(async (productId) => {
//     if (!productId || !token) { setVariationsForFilter([]); return; }
//     setLoadingSubItems(true);
//     try {
//       const response = await fetch(`http://localhost:3001/api/products/${productId}/variations`, { headers: { 'x-access-token': token } });
//       const data = response.ok ? await response.json() : [];
//       setVariationsForFilter(Array.isArray(data) ? data : []);
//     } catch (err) { console.error("Error fetching variations for filter:", err); setVariationsForFilter([]);}
//     finally { setLoadingSubItems(false); }
//   }, [token]);

//   // Fetch accessories for the selected product in filter
//   const fetchAccessoriesForFilterDropdown = useCallback(async (productId) => {
//     if (!productId || !token) { setAccessoriesForFilter([]); return; }
//     setLoadingSubItems(true);
//     try {
//       const response = await fetch(`http://localhost:3001/api/products/${productId}/accessories`, { headers: { 'x-access-token': token } });
//       const data = response.ok ? await response.json() : [];
//       setAccessoriesForFilter(Array.isArray(data) ? data : []);
//     } catch (err) { console.error("Error fetching accessories for filter:", err); setAccessoriesForFilter([]);}
//     finally { setLoadingSubItems(false); }
//   }, [token]);
  
//   const fetchStockMovements = useCallback(async () => {
//     if (!token) { setError("Please login to view stock movements."); setStockMovements([]); setLoading(false); return; }
//     setLoading(true); setError('');
//     const queryParams = new URLSearchParams();
//     if (filters.productId) queryParams.append('productId', filters.productId);
//     if (filters.variationId) queryParams.append('variationId', filters.variationId);
//     if (filters.accessoryId) queryParams.append('accessoryId', filters.accessoryId);
//     if (filters.movementType) queryParams.append('movementType', filters.movementType);
//     if (filters.userId) queryParams.append('userId', filters.userId);
//     if (filters.startDate) queryParams.append('startDate', filters.startDate);
//     if (filters.endDate) queryParams.append('endDate', filters.endDate);
//     const endpoint = `http://localhost:3001/api/stock/movements?${queryParams.toString()}`;
//     try {
//       const response = await fetch(endpoint, { headers: { 'x-access-token': token }});
//       if (!response.ok) { const d = await response.json(); throw new Error(d.message || 'Failed to fetch movements'); }
//       setStockMovements(Array.isArray(await response.json()) ? await response.json() : []);
//     } catch (err) { setError(err.message); setStockMovements([]); } 
//     finally { setLoading(false); }
//   }, [token, filters]);

//   useEffect(() => {
//     if (token) {
//       fetchFilterDropdownData(); // Fetch initial dropdowns
//       fetchStockMovements();     // Fetch initial movements
//     }
//   }, [token, fetchFilterDropdownData, fetchStockMovements]); // Only depends on token and memoized fetchers

//   // Effect to fetch variations/accessories when product filter changes
//   useEffect(() => {
//     if (filters.productId) {
//       const selectedProduct = productsForFilter.find(p => p.id === parseInt(filters.productId));
//       if (selectedProduct) {
//         if (selectedProduct.product_type === 'variable') {
//           fetchVariationsForFilterDropdown(filters.productId);
//           setAccessoriesForFilter([]); // Clear accessories if product is variable
//         } else if (selectedProduct.product_type === 'customisable') {
//           fetchAccessoriesForFilterDropdown(filters.productId);
//           setVariationsForFilter([]); // Clear variations if product is customisable
//         } else { // Simple product
//           setVariationsForFilter([]);
//           setAccessoriesForFilter([]);
//         }
//       }
//     } else { // No product selected, clear sub-item filters
//       setVariationsForFilter([]);
//       setAccessoriesForFilter([]);
//     }
//   }, [filters.productId, productsForFilter, fetchVariationsForFilterDropdown, fetchAccessoriesForFilterDropdown, token]);


//   const handleFilterChange = (event) => {
//     const { name, value } = event.target;
//     setFilters(prevFilters => {
//       const newFilters = { ...prevFilters, [name]: value };
//       if (name === 'productId') { // If product changes, reset variation and accessory
//         newFilters.variationId = '';
//         newFilters.accessoryId = '';
//       }
//       return newFilters;
//     });
//   };

//   const handleApplyFilters = () => { fetchStockMovements(); };
//   const handleClearFilters = () => { setFilters({ productId: '', variationId: '', accessoryId: '', movementType: '', userId: '', startDate: '', endDate: ''}); };
//   const handleOpenAdjustmentModal = () => { setOpenAdjustmentModal(true); };
//   const handleCloseAdjustmentModal = () => { setOpenAdjustmentModal(false); };
//   const handleSaveAdjustment = () => { fetchStockMovements(); };
//   const canUserAdjustStock = user && (user.role === 'admin' || user.role === 'super_admin');

//   return (
//     <Box sx={{ p: 3 }}>
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//         <Typography variant="h4" gutterBottom>Stock Movements Log</Typography>
//         {canUserAdjustStock && ( <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={handleOpenAdjustmentModal}> Manual Stock Adjustment </Button> )}
//       </Box>

//       <Paper sx={{ p: 2, mb: 3 }} elevation={2}>
//         <Typography variant="h6" gutterBottom>Filters</Typography>
//         <Grid container spacing={2} alignItems="flex-end">
//           <Grid item xs={12} sm={6} md={2}>
//             <FormControl fullWidth size="small" variant="outlined">
//               <InputLabel id="product-filter-label">Product</InputLabel>
//               <Select labelId="product-filter-label" name="productId" value={filters.productId} onChange={handleFilterChange} label="Product">
//                 <MenuItem value=""><em>All Products</em></MenuItem>
//                 {productsForFilter.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
//               </Select>
//             </FormControl>
//           </Grid>
//           <Grid item xs={12} sm={6} md={2}>
//             <FormControl fullWidth size="small" variant="outlined" disabled={!filters.productId || variationsForFilter.length === 0}>
//               <InputLabel id="variation-filter-label">Variation</InputLabel>
//               <Select labelId="variation-filter-label" name="variationId" value={filters.variationId} onChange={handleFilterChange} label="Variation">
//                 <MenuItem value=""><em>All Variations</em></MenuItem>
//                 {variationsForFilter.map(v => <MenuItem key={v.id} value={v.id}>{`${v.attribute_name}: ${v.attribute_value}`}</MenuItem>)}
//               </Select>
//             </FormControl>
//           </Grid>
//           <Grid item xs={12} sm={6} md={2}>
//              <FormControl fullWidth size="small" variant="outlined" disabled={!filters.productId || accessoriesForFilter.length === 0}>
//               <InputLabel id="accessory-filter-label">Accessory</InputLabel>
//               <Select labelId="accessory-filter-label" name="accessoryId" value={filters.accessoryId} onChange={handleFilterChange} label="Accessory">
//                 <MenuItem value=""><em>All Accessories</em></MenuItem>
//                 {accessoriesForFilter.map(acc => <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>)}
//               </Select>
//             </FormControl>
//           </Grid>
//           <Grid item xs={12} sm={6} md={2}> {/* Adjusted md for better spacing */}
//              <FormControl fullWidth size="small" variant="outlined">
//               <InputLabel id="movetype-filter-label">Movement Type</InputLabel>
//               <Select labelId="movetype-filter-label" name="movementType" value={filters.movementType} onChange={handleFilterChange} label="Movement Type">
//                 <MenuItem value=""><em>All Types</em></MenuItem>
//                 <MenuItem value="initial_stock">Initial Stock (Product)</MenuItem>
//                 <MenuItem value="initial_stock_var">Initial Stock (Variation)</MenuItem>
//                 <MenuItem value="initial_stock_acc">Initial Stock (Accessory)</MenuItem>
//                 <MenuItem value="adjustment_in">Adj. IN (Product)</MenuItem>
//                 <MenuItem value="adjustment_out">Adj. OUT (Product)</MenuItem>
//                 <MenuItem value="adjustment_in_var">Adj. IN (Variation)</MenuItem>
//                 <MenuItem value="adjustment_out_var">Adj. OUT (Variation)</MenuItem>
//                 <MenuItem value="adjustment_in_acc">Adj. IN (Accessory)</MenuItem>
//                 <MenuItem value="adjustment_out_acc">Adj. OUT (Accessory)</MenuItem>
//                 <MenuItem value="damaged">Damaged</MenuItem>
//                 <MenuItem value="sale">Sale</MenuItem>
//                 <MenuItem value="return_customer">Customer Return</MenuItem>
//               </Select>
//             </FormControl>
//           </Grid>
//           {canUserAdjustStock && (
//           <Grid item xs={12} sm={6} md={2}>
//             <FormControl fullWidth size="small" variant="outlined">
//               <InputLabel id="user-filter-label">User (Adjuster)</InputLabel>
//               <Select labelId="user-filter-label" name="userId" value={filters.userId} onChange={handleFilterChange} label="User (Adjuster)">
//                 <MenuItem value=""><em>All Users</em></MenuItem>
//                 {usersForFilter.map(u => <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>)}
//               </Select>
//             </FormControl>
//           </Grid>
//           )}
//           <Grid item xs={12} sm={4} md={1}><TextField label="Start Date" name="startDate" type="date" value={filters.startDate} onChange={handleFilterChange} fullWidth size="small" variant="outlined" InputLabelProps={{ shrink: true }} /></Grid>
//           <Grid item xs={12} sm={4} md={1}><TextField label="End Date" name="endDate" type="date" value={filters.endDate} onChange={handleFilterChange} fullWidth size="small" variant="outlined" InputLabelProps={{ shrink: true }} /></Grid>
//           <Grid item xs={12} sm={4} md={2} display="flex" justifyContent={{xs: "flex-start", sm:"flex-end"}} alignItems="center" gap={1}>
//             <Button onClick={handleClearFilters} size="medium" variant="outlined">Clear</Button>
//             <Button onClick={handleApplyFilters} variant="contained" size="medium">Apply</Button>
//           </Grid>
//         </Grid>
//       </Paper>

//       {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      
//       {loading ? ( <Box sx={{display: 'flex', justifyContent: 'center', my: 3}}><CircularProgress /><Typography sx={{ml:1}}>Loading movements...</Typography></Box> ) : (
//         <TableContainer component={Paper} elevation={3}>
//           <Table sx={{ minWidth: 750 }} aria-label="stock movements table">
//             <TableHead sx={{ backgroundColor: (theme) => theme.palette.grey[200] }}>
//               <TableRow>
//                 <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
//                 <TableCell sx={{ fontWeight: 'bold' }}>Item Details</TableCell>
//                 <TableCell sx={{ fontWeight: 'bold' }}>Movement Type</TableCell>
//                 <TableCell sx={{ fontWeight: 'bold' }} align="right">Qty Changed</TableCell>
//                 <TableCell sx={{ fontWeight: 'bold', maxWidth: 150 }}>Remarks</TableCell>
//                 <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {stockMovements.length === 0 && !error && ( <TableRow><TableCell colSpan={6} align="center">No stock movements found.</TableCell></TableRow> )}
//               {stockMovements.map((move) => (
//                 <TableRow key={move.id} hover>
//                   <TableCell>{new Date(move.createdAt).toLocaleString()}</TableCell>
//                   <TableCell>
//                     {/* Check product first for simple product movements */}
//                     {move.product && !move.variation_id && !move.accessory_id && `Product: ${move.product.name} (SKU: ${move.product.sku || 'N/A'})`}
//                     {/* Then check variation */}
//                     {move.variation && `Variation: ${move.variation.attribute_name || 'N/A'}: ${move.variation.attribute_value || 'N/A'} (of Prod. ID: ${move.product_id || move.variation.product_id})`}
//                     {/* Then check accessory */}
//                     {move.accessory && `Accessory: ${move.accessory.name || 'N/A'} (for Prod. ID: ${move.product_id || move.accessory.product_id})`}
//                   </TableCell>
//                   <TableCell>{move.movement_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableCell>
//                   <TableCell align="right" sx={{ color: move.quantity_changed < 0 ? 'error.main' : 'success.main', fontWeight: 'bold' }}>
//                     {move.quantity_changed > 0 ? `+${move.quantity_changed}` : move.quantity_changed}
//                   </TableCell>
//                   <TableCell sx={{maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={move.remarks || ''}>{move.remarks || '-'}</TableCell>
//                   <TableCell>{move.user ? move.user.username : (move.user_id || 'System')}</TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       )}

//       {openAdjustmentModal && canUserAdjustStock && (
//         <StockAdjustmentModal
//           open={openAdjustmentModal}
//           onClose={handleCloseAdjustmentModal}
//           onSave={handleSaveAdjustment}
//         />
//       )}
//     </Box>
//   );
// };

// export default StockPage;