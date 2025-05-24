// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { signin as apiSignin, signup as apiSignup } from '../services/api'; // Assuming api.js is in services

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // setUser is defined here
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true); // To handle initial auth check

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        setToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiSignin(username, password);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to login');
      }
      const userDetails = {
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role
      };
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(userDetails));
      setToken(data.accessToken);
      setUser(userDetails); // Update context with user details
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const signup = async (username, email, password, role) => {
    try {
      const response = await apiSignup(username, email, password, role);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign up');
      }
      return data;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return <div>Loading authentication...</div>; // Or a spinner
  }

  return (
    <AuthContext.Provider value={{ 
        isAuthenticated: !!token, 
        user, 
        token, 
        login, 
        signup, 
        logout, 
        setUser // <<--- YAHAN `setUser` KO EXPOSE KIYA HAI
      }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};


// // frontend/src/contexts/AuthContext.jsx
// import React, { createContext, useState, useContext, useEffect } from 'react';
// import { signin as apiSignin, signup as apiSignup } from '../services/api'; // Assuming api.js is in services

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(localStorage.getItem('accessToken'));
//   const [loading, setLoading] = useState(true); // To handle initial auth check

//   useEffect(() => {
//     const storedToken = localStorage.getItem('accessToken');
//     const storedUser = localStorage.getItem('user'); // User details (id, username, email, role)
//     if (storedToken && storedUser) {
//       setToken(storedToken);
//       setUser(JSON.parse(storedUser));
//     }
//     setLoading(false);
//   }, []);

//   const login = async (username, password) => {
//     try {
//       const response = await apiSignin(username, password);
//       const data = await response.json();
//       if (!response.ok) {
//         throw new Error(data.message || 'Failed to login');
//       }
//       localStorage.setItem('accessToken', data.accessToken);
//       localStorage.setItem('user', JSON.stringify({ // Store user details except token
//         id: data.id,
//         username: data.username,
//         email: data.email,
//         role: data.role
//       }));
//       setToken(data.accessToken);
//       setUser({ id: data.id, username: data.username, email: data.email, role: data.role });
//       return data;
//     } catch (error) {
//       console.error("Login error:", error);
//       throw error;
//     }
//   };

//   const signup = async (username, email, password, role) => {
//     try {
//       const response = await apiSignup(username, email, password, role);
//       const data = await response.json();
//       if (!response.ok) {
//         throw new Error(data.message || 'Failed to sign up');
//       }
//       // Optionally, you can automatically log in the user here or redirect to login
//       return data;
//     } catch (error) {
//       console.error("Signup error:", error);
//       throw error;
//     }
//   };

//   const logout = () => {
//     localStorage.removeItem('accessToken');
//     localStorage.removeItem('user');
//     setToken(null);
//     setUser(null);
//   };

//   if (loading) {
//     return <div>Loading authentication...</div>; // Or a spinner
//   }

//   return (
//     <AuthContext.Provider value={{ isAuthenticated: !!token, user, token, login, signup, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// // eslint-disable-next-line react-refresh/only-export-components
// export const useAuth = () => {
//   return useContext(AuthContext);
// };