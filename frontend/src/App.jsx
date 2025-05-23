// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import { useAuth } from './contexts/AuthContext'; // <<--- Import useAuth

// Pages
import DashboardPage from './pages/DashboardPage';
import WebsitesPage from './pages/WebsitesPage';
import SuppliersPage from './pages/SuppliersPage';
import CategoriesPage from './pages/CategoriesPage';
import ProductsPage from './pages/ProductsPage';
import StockPage from './pages/StockPage';
import SalesPage from './pages/SalesPage';
import RecycleBinPage from './pages/RecycleBinPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage'; // <<--- Import LoginPage
import SignupPage from './pages/SignupPage'; // <<--- Import SignupPage

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth(); // Get auth status from context
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout>{children}</AppLayout>;
};

const PublicRoute = ({ children }) => { // For Login/Signup pages
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  const { isAuthenticated } = useAuth(); // Get auth status for default route

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} /> {/* <<--- Add Signup Route */}

        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/websites" element={<ProtectedRoute><WebsitesPage /></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute><SuppliersPage /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
        <Route path="/stock" element={<ProtectedRoute><StockPage /></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
        <Route path="/recycle-bin" element={<ProtectedRoute><RecycleBinPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<ProtectedRoute><div>404 Page Not Found within AppLayout</div></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}
export default App;












// // frontend/src/App.jsx
// // import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import AppLayout from './components/AppLayout';

// // Pages
// import DashboardPage from './pages/DashboardPage';
// import WebsitesPage from './pages/WebsitesPage';
// import SuppliersPage from './pages/SuppliersPage';
// import CategoriesPage from './pages/CategoriesPage';
// import ProductsPage from './pages/ProductsPage';
// import StockPage from './pages/StockPage';
// import SalesPage from './pages/SalesPage';
// import RecycleBinPage from './pages/RecycleBinPage';
// import ReportsPage from './pages/ReportsPage';
// import SettingsPage from './pages/SettingsPage';

// const LoginPage = () => <div>Login Page Placeholder - Connect to Backend Later</div>;
// const isAuthenticated = () => !!localStorage.getItem('accessToken'); // Basic auth check

// const ProtectedRoute = ({ children }) => {
//   if (!isAuthenticated()) {
//     return <Navigate to="/login" replace />;
//   }
//   return <AppLayout>{children}</AppLayout>;
// };

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/login" element={<LoginPage />} />

//         <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
//         <Route path="/websites" element={<ProtectedRoute><WebsitesPage /></ProtectedRoute>} />
//         <Route path="/suppliers" element={<ProtectedRoute><SuppliersPage /></ProtectedRoute>} />
//         <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
//         <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
//         <Route path="/stock" element={<ProtectedRoute><StockPage /></ProtectedRoute>} />
//         <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
//         <Route path="/recycle-bin" element={<ProtectedRoute><RecycleBinPage /></ProtectedRoute>} />
//         <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
//         <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

//         <Route
//           path="/"
//           element={
//             isAuthenticated() ? (
//               <Navigate to="/dashboard" replace />
//             ) : (
//               <Navigate to="/login" replace />
//             )
//           }
//         />
//         <Route path="*" element={<ProtectedRoute><div>404 Page Not Found within AppLayout</div></ProtectedRoute>} />
//       </Routes>
//     </Router>
//   );
// }
// export default App;
