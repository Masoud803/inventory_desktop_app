// frontend/src/services/api.js
const API_URL = "http://localhost:3001/api/auth/"; // Tumhara Express backend URL

export const signup = (username, email, password, role) => {
  return fetch(API_URL + "signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password, role }),
  });
};

export const signin = (username, password) => {
  return fetch(API_URL + "signin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
};

// Tum yahan aur API calls (token ke saath) add kar sakte ho baad mein