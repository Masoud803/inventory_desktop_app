// frontend/src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles'; // Import ThemeProvider, createTheme, responsiveFontSizes

// Define a custom theme
let customTheme = createTheme({
  palette: {
  mode: 'light',
  primary: {
    main: '#546e7a', // Blue Grey (main interactive elements)
  },
  secondary: {
    main: '#1e88e5', // A brighter blue for specific highlights/accents
  },
  background: {
    default: '#e0e0e0', // Light Stone Grey (overall background)
    paper: '#f5f5f5',   // Slightly off-white for paper elements
  },
  text: {
    primary: '#37474f', // Dark Slate Grey
    secondary: '#78909c', // Lighter Slate Grey
  },
  divider: '#bdbdbd' // For borders and dividers
},
// ... baaki theme (typography, components) waise hi ...
  typography: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif', // Standard font
    h4: {
      fontWeight: 600, // Thore se bolder headings
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    }
  },
  components: {
    MuiPaper: { // Paper components (jaise Cards, TableContainer) ke liye default style
      styleOverrides: {
        root: {
          elevation: 2, // Thora kam shadow by default
        }
      }
    },
    MuiButton: { // Buttons ke liye default style
      defaultProps: {
        // variant: 'contained', // Agar saare buttons by default contained chahiye
      },
      styleOverrides: {
        root: {
          textTransform: 'none', // "Proper case" buttons, na ke UPPERCASE
          borderRadius: '4px',  // Thore kam rounded corners
        }
      }
    },
    MuiAppBar: { // AppBar ke liye
        styleOverrides: {
            root: {
                // elevation: 1, // Agar kam shadow chahiye AppBar pe
            }
        }
    },
    MuiDrawer: { // Sidebar/Drawer ke liye
        styleOverrides: {
            paper: {
                // borderRight: 'none', // Agar border nahi chahiye drawer pe
            }
        }
    }
    // Aur bhi components ke default styles yahan set kar sakte hain
  }
});

// Make typography responsive
customTheme = responsiveFontSizes(customTheme);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider theme={customTheme}> {/* <<--- ThemeProvider Add Karo */}
        <CssBaseline />
        <App />
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
);



// // frontend/src/main.jsx
// import { StrictMode } from 'react';
// import { createRoot } from 'react-dom/client';
// import App from './App.jsx';
// import CssBaseline from '@mui/material/CssBaseline';
// import { AuthProvider } from './contexts/AuthContext'; // <<--- Import AuthProvider

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <AuthProvider> {/* <<--- Wrap App with AuthProvider */}
//       <CssBaseline />
//       <App />
//     </AuthProvider>
//   </StrictMode>,
// );