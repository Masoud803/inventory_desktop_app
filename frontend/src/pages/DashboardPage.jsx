// frontend/src/pages/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid'; // For layout
import Paper from '@mui/material/Paper'; // For cards
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link'; // For navigation links
import { Link as RouterLink } from 'react-router-dom'; // For React Router navigation
import { useAuth } from '../contexts/AuthContext'; // Adjust path

// Example Icons (optional, but make it look nice)
import WebIcon from '@mui/icons-material/Web';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import InventoryIcon from '@mui/icons-material/Inventory'; // For Products (future)
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'; // For POS/Sales (future)

// Helper component for stat cards
const StatCard = ({ title, count, icon, linkTo }) => (
  <Card sx={{ minWidth: 200, textAlign: 'center' }} elevation={3}>
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
      <CardActions sx={{ justifyContent: 'center' }}>
        <Button size="small" component={RouterLink} to={linkTo}>View All</Button>
      </CardActions>
    )}
  </Card>
);


const DashboardPage = () => {
  const { token, user } = useAuth();
  // We'll fetch actual counts later when APIs are ready and we have data
  const [websiteCount, setWebsiteCount] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [productCount, setProductCount] = useState(0); // Placeholder for future

  // Fetch counts when component mounts (Example)
  useEffect(() => {
    if (token) {
      // Fetch Website Count
      fetch('http://localhost:3001/api/websites', { headers: { 'x-access-token': token }})
        .then(res => res.json())
        .then(data => setWebsiteCount(Array.isArray(data) ? data.length : 0))
        .catch(() => setWebsiteCount(0));

      // Fetch Supplier Count
      fetch('http://localhost:3001/api/suppliers', { headers: { 'x-access-token': token }})
        .then(res => res.json())
        .then(data => setSupplierCount(Array.isArray(data) ? data.length : 0))
        .catch(() => setSupplierCount(0));
      
      // Fetch Category Count
      fetch('http://localhost:3001/api/categories', { headers: { 'x-access-token': token }})
        .then(res => res.json())
        .then(data => setCategoryCount(Array.isArray(data) ? data.length : 0))
        .catch(() => setCategoryCount(0));
        
      // TODO: Fetch Product count when product module is ready
    }
  }, [token]);


  return (
    <Box sx={{p:3}}> {/* Added padding to the main Box of DashboardPage */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Website Stat Card */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Websites" count={websiteCount} icon={<WebIcon />} linkTo="/websites" />
        </Grid>

        {/* Supplier Stat Card */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Suppliers" count={supplierCount} icon={<PeopleIcon />} linkTo="/suppliers" />
        </Grid>

        {/* Category Stat Card */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Categories" count={categoryCount} icon={<CategoryIcon />} linkTo="/categories" />
        </Grid>
        
        {/* Product Stat Card (Placeholder for future) */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Products" count={productCount} icon={<InventoryIcon />} linkTo="/products" />
        </Grid>

        {/* Add more cards or sections as needed */}
        {/* For example, a card for quick POS access */}
        <Grid item xs={12} sm={6} md={3}>
           <Card sx={{ minWidth: 200, textAlign: 'center', backgroundColor: 'secondary.light' }} elevation={3}> {/* Example different style */}
            <CardContent>
                <PointOfSaleIcon sx={{ fontSize: 40, mb: 1, color: 'secondary.contrastText' }} />
                <Typography sx={{ fontSize: 16, color: 'secondary.contrastText' }} gutterBottom>
                    Point of Sale
                </Typography>
                <Typography variant="h5" component="div" sx={{color: 'secondary.contrastText'}}>
                    New Sale
                </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center' }}>
                <Button size="small" component={RouterLink} to="/pos" sx={{color: 'secondary.contrastText'}}> {/* Assuming /pos route for POS page */}
                    Go to POS
                </Button>
            </CardActions>
           </Card>
        </Grid>
      </Grid>

      {/* TODO: Add other dashboard elements like:
          - Recent Sales (Table/List)
          - Quick Actions (Buttons to Add Product, Add Category etc.)
          - Charts for sales/inventory (when data is available)
      */}
    </Box>
  );
};

export default DashboardPage;


// // frontend/src/pages/DashboardPage.jsx
// import Typography from '@mui/material/Typography';
// const DashboardPage = () => <Typography variant="h4">Dashboard Page</Typography>;
// export default DashboardPage;