// frontend/src/components/StockAdjustmentModal.jsx
import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import FormLabel from '@mui/material/FormLabel'; // For RadioGroup label
import { useAuth } from '../contexts/AuthContext'; // Adjust path

const StockAdjustmentModal = ({ open, onClose, onSave }) => {
  const { token } = useAuth();
  
  const [adjustmentFor, setAdjustmentFor] = useState('product'); // 'product', 'variation', 'accessory'
  const [itemId, setItemId] = useState(''); // Will hold product_id, variation_id, or accessory_id
  
  const [movementType, setMovementType] = useState('adjustment_in');
  const [quantity, setQuantity] = useState('');
  const [remarks, setRemarks] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset form
      setAdjustmentFor('product');
      setItemId('');
      setMovementType('adjustment_in');
      setQuantity('');
      setRemarks('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!movementType || !quantity || !itemId) {
      setError("Adjustment type, quantity, and the respective Item ID are required.");
      return;
    }
    const numQuantity = parseInt(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
        setError("Quantity must be a positive number.");
        return;
    }
    if (isNaN(parseInt(itemId))) {
        setError("Item ID must be a number.");
        return;
    }

    setLoading(true);
    const payload = {
      product_id: adjustmentFor === 'product' ? parseInt(itemId) : null,
      variation_id: adjustmentFor === 'variation' ? parseInt(itemId) : null,
      accessory_id: adjustmentFor === 'accessory' ? parseInt(itemId) : null,
      movement_type: movementType,
      quantity: numQuantity, // Backend will determine if it's in or out based on movement_type
      remarks: remarks,
    };

    try {
      const response = await fetch('http://localhost:3001/api/stock/adjustments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify(payload),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create stock adjustment');
      }
      onSave(); // Refresh stock movements list in parent
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
    <Dialog open={open} onClose={handleClose} PaperProps={{ component: 'form', onSubmit: handleSubmit }} maxWidth="sm" fullWidth>
      <DialogTitle>Manual Stock Adjustment</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        <Grid container spacing={2} sx={{pt:1}}>
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Adjustment For:</FormLabel>
              <RadioGroup
                row
                aria-label="adjustment-for"
                name="adjustmentForRadio"
                value={adjustmentFor}
                onChange={(e) => { setAdjustmentFor(e.target.value); setItemId(''); /* Clear ID on type change */}}
              >
                <FormControlLabel value="product" control={<Radio />} label="Simple Product" />
                <FormControlLabel value="variation" control={<Radio />} label="Variation" />
                <FormControlLabel value="accessory" control={<Radio />} label="Accessory" />
              </RadioGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField 
              label={`${adjustmentFor.charAt(0).toUpperCase() + adjustmentFor.slice(1)} ID`} 
              name="itemId" 
              type="number"
              value={itemId} 
              onChange={(e) => setItemId(e.target.value)} 
              fullWidth 
              size="small" 
              variant="outlined" 
              required
              helperText={`Enter ID of the ${adjustmentFor} to adjust stock for.`}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" variant="outlined" required>
              <InputLabel id="movement-type-label">Movement Type</InputLabel>
              <Select labelId="movement-type-label" value={movementType} label="Movement Type" onChange={(e) => setMovementType(e.target.value)}>
                <MenuItem value="initial_stock">Initial Stock (Caution!)</MenuItem>
                <MenuItem value="adjustment_in">Adjustment IN (+)</MenuItem>
                <MenuItem value="adjustment_out">Adjustment OUT (-)</MenuItem>
                <MenuItem value="damaged">Damaged Stock (-)</MenuItem>
                {/* Add other types like 'sale_adj', 'return_adj' if needed for manual overrides */}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Quantity (Positive)" name="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} fullWidth size="small" variant="outlined" required InputProps={{ inputProps: { min: 1 }}} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Remarks (Optional)" name="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} fullWidth size="small" variant="outlined" multiline rows={2} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading} color="inherit">Cancel</Button>
        <Button type="submit" disabled={loading} variant="contained">
          {loading ? <CircularProgress size={24} /> : 'Adjust Stock'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default StockAdjustmentModal;


// // frontend/src/components/StockAdjustmentModal.jsx
// import React, { useState, useEffect } from 'react';
// import Button from '@mui/material/Button';
// import TextField from '@mui/material/TextField';
// import Dialog from '@mui/material/Dialog';
// import DialogActions from '@mui/material/DialogActions';
// import DialogContent from '@mui/material/DialogContent';
// import DialogTitle from '@mui/material/DialogTitle';
// import FormControl from '@mui/material/FormControl';
// import InputLabel from '@mui/material/InputLabel';
// import Select from '@mui/material/Select';
// import MenuItem from '@mui/material/MenuItem';
// import Grid from '@mui/material/Grid';
// import Alert from '@mui/material/Alert';
// import CircularProgress from '@mui/material/CircularProgress';
// import { useAuth } from '../contexts/AuthContext'; // Adjust path

// const StockAdjustmentModal = ({ open, onClose, onSave }) => {
//   const { token } = useAuth();
//   const [productId, setProductId] = useState('');
//   const [variationId, setVariationId] = useState(''); // Optional
//   const [movementType, setMovementType] = useState('adjustment_in'); // Default
//   const [quantity, setQuantity] = useState('');
//   const [remarks, setRemarks] = useState('');
  
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   // TODO: Fetch products and their variations for dropdowns if needed for selection
//   // const [products, setProducts] = useState([]);
//   // const [variationsOfSelectedProduct, setVariationsOfSelectedProduct] = useState([]);

//   useEffect(() => {
//     if (open) {
//       // Reset form
//       setProductId('');
//       setVariationId('');
//       setMovementType('adjustment_in');
//       setQuantity('');
//       setRemarks('');
//       setError('');
//     }
//   }, [open]);

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setError('');
//     if (!movementType || !quantity || (!productId && !variationId)) {
//       setError("Movement type, quantity, and either Product ID or Variation ID are required.");
//       return;
//     }
//     if (parseInt(quantity) <= 0) {
//         setError("Quantity must be a positive number.");
//         return;
//     }

//     setLoading(true);
//     const payload = {
//       product_id: productId ? parseInt(productId) : null,
//       variation_id: variationId ? parseInt(variationId) : null,
//       movement_type: movementType,
//       quantity: parseInt(quantity), // Backend will handle if it's in or out based on movement_type
//       remarks: remarks,
//     };

//     try {
//       const response = await fetch('http://localhost:3001/api/stock/adjustments', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'x-access-token': token,
//         },
//         body: JSON.stringify(payload),
//       });
//       const responseData = await response.json();
//       if (!response.ok) {
//         throw new Error(responseData.message || 'Failed to create stock adjustment');
//       }
//       onSave(); // Refresh stock movements list in parent
//       handleClose();
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleClose = () => {
//     if (loading) return;
//     onClose();
//   };

//   return (
//     <Dialog open={open} onClose={handleClose} PaperProps={{ component: 'form', onSubmit: handleSubmit }} maxWidth="sm" fullWidth>
//       <DialogTitle>Manual Stock Adjustment</DialogTitle>
//       <DialogContent>
//         {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
//         <Grid container spacing={2} sx={{pt:1}}>
//           <Grid item xs={12} sm={6}>
//             <TextField label="Product ID (for Simple Product)" name="productId" value={productId} onChange={(e) => { setProductId(e.target.value); setVariationId('');}} fullWidth size="small" variant="outlined" helperText="Enter if adjusting a Simple Product's stock" />
//           </Grid>
//           <Grid item xs={12} sm={6}>
//             <TextField label="Variation ID (for Variable Product)" name="variationId" value={variationId} onChange={(e) => { setVariationId(e.target.value); setProductId('');}} fullWidth size="small" variant="outlined" helperText="Enter if adjusting a Variation's stock" />
//           </Grid>
//           <Grid item xs={12} sm={6}>
//             <FormControl fullWidth size="small" variant="outlined" required>
//               <InputLabel id="movement-type-label">Movement Type</InputLabel>
//               <Select labelId="movement-type-label" value={movementType} label="Movement Type" onChange={(e) => setMovementType(e.target.value)}>
//                 <MenuItem value="initial_stock">Initial Stock (Use with caution)</MenuItem>
//                 <MenuItem value="adjustment_in">Adjustment IN (+)</MenuItem>
//                 <MenuItem value="adjustment_out">Adjustment OUT (-)</MenuItem>
//                 <MenuItem value="damaged">Damaged Stock (-)</MenuItem>
//                 {/* Add other types as needed, e.g., 'return_customer', 'return_to_supplier' will be handled by those modules */}
//               </Select>
//             </FormControl>
//           </Grid>
//           <Grid item xs={12} sm={6}>
//             <TextField label="Quantity (Positive Number)" name="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} fullWidth size="small" variant="outlined" required InputProps={{ inputProps: { min: 1 }}} />
//           </Grid>
//           <Grid item xs={12}>
//             <TextField label="Remarks (Optional)" name="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} fullWidth size="small" variant="outlined" multiline rows={2} />
//           </Grid>
//         </Grid>
//       </DialogContent>
//       <DialogActions>
//         <Button onClick={handleClose} disabled={loading} color="inherit">Cancel</Button>
//         <Button type="submit" disabled={loading} variant="contained">
//           {loading ? <CircularProgress size={24} /> : 'Adjust Stock'}
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// };
// export default StockAdjustmentModal;