// frontend/src/pages/DashboardPage.jsx
import React, { useEffect, useState, useCallback } from 'react'; // Added useCallback
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid'; // For layout
// import Paper from '@mui/material/Paper'; // Not directly used by StatCard if Card is used
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
// import Link from '@mui/material/Link'; // Not directly used, RouterLink is used
import { Link as RouterLink } from 'react-router-dom'; // For React Router navigation
import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed
import CircularProgress from '@mui/material/CircularProgress'; // For loading state
import Alert from '@mui/material/Alert'; // For error display

// Example Icons
import WebIcon from '@mui/icons-material/Web';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import InventoryIcon from '@mui/icons-material/Inventory'; 
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';

// Helper component for stat cards (yeh waise hi rahega jaisa tumne diya tha)
const StatCard = ({ title, count, icon, linkTo }) => (
  <Card sx={{ minWidth: 180, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} elevation={3}>
    <CardContent>
      {icon && React.cloneElement(icon, { sx: { fontSize: 40, mb: 1, color: 'primary.main' } })}
      <Typography sx={{ fontSize: 16 }} color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" component="div">
        {count}
      </Typography>
    </CardContent>
    {linkTo && (
      <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
        <Button size="small" component={RouterLink} to={linkTo}>View All</Button>
      </CardActions>
    )}
  </Card>
);


const DashboardPage = () => {
  const { token } = useAuth(); // User object yahan zaroori nahi agar sirf counts dikha rahe hain
  const [websiteCount, setWebsiteCount] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [productCount, setProductCount] = useState(0); // State for product count
  const [loading, setLoading] = useState(true); // Single loading state for all counts
  const [error, setError] = useState('');     // Single error state

  // useCallback for fetching all counts together
  const fetchDashboardData = useCallback(async () => {
    if (!token) {
      setError("Please login to view dashboard data.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(''); // Clear previous errors

    try {
      const headers = { 'x-access-token': token };
      // Fetch all counts in parallel
      const responses = await Promise.all([
        fetch('http://localhost:3001/api/websites', { headers }),
        fetch('http://localhost:3001/api/suppliers', { headers }),
        fetch('http://localhost:3001/api/categories', { headers }),
        fetch('http://localhost:3001/api/products', { headers }) // Fetch products
      ]);

      // Process responses
      const websitesData = responses[0].ok ? await responses[0].json() : [];
      const suppliersData = responses[1].ok ? await responses[1].json() : [];
      const categoriesData = responses[2].ok ? await responses[2].json() : [];
      const productsData = responses[3].ok ? await responses[3].json() : []; // Process products response

      setWebsiteCount(Array.isArray(websitesData) ? websitesData.length : 0);
      setSupplierCount(Array.isArray(suppliersData) ? suppliersData.length : 0);
      setCategoryCount(Array.isArray(categoriesData) ? categoriesData.length : 0);
      setProductCount(Array.isArray(productsData) ? productsData.length : 0); // Set product count

    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Could not load some dashboard data. Please try again later.");
      // Reset counts on error to avoid showing stale data
      setWebsiteCount(0);
      setSupplierCount(0);
      setCategoryCount(0);
      setProductCount(0);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // useEffect will run when fetchDashboardData (which depends on token) changes


  return (
    <Box sx={{p:3}}> 
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Dashboard
      </Typography>
      
      {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}

      {loading ? (
        <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
            <CircularProgress />
            <Typography sx={{ml:2}}>Loading Dashboard...</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Websites" count={websiteCount} icon={<WebIcon />} linkTo="/websites" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Suppliers" count={supplierCount} icon={<PeopleIcon />} linkTo="/suppliers" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Categories" count={categoryCount} icon={<CategoryIcon />} linkTo="/categories" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Products" count={productCount} icon={<InventoryIcon />} linkTo="/products" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
             <Card sx={{ minWidth: 180, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: 'secondary.light' }} elevation={3}>
              <CardContent>
                  <PointOfSaleIcon sx={{ fontSize: 40, mb: 1, color: 'secondary.contrastText' }} />
                  <Typography sx={{ fontSize: 16, color: 'secondary.contrastText' }} gutterBottom>
                      Point of Sale
                  </Typography>
                  <Typography variant="h5" component="div" sx={{color: 'secondary.contrastText'}}>
                      New Sale
                  </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pt:0 }}>
                  <Button size="small" component={RouterLink} to="/pos" sx={{color: 'secondary.contrastText'}}>
                      Go to POS
                  </Button>
              </CardActions>
             </Card>
          </Grid>
        </Grid>
      )}
      {/* TODO: Add other dashboard elements */}
    </Box>
  );
};
export default DashboardPage;