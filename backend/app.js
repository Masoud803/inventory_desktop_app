// inventory-app/backend/app.js

const express = require('express');
const app = express();
const cors = require('cors'); // <<--- 1. CORS ko require karo
const PORT = process.env.PORT || 3001; // Backend server is port pe chalega

// Middleware to parse JSON request bodies
app.use(express.json());
// Middleware to parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

const db = require("./models"); // Hamara models/index.js

// Database sync
// Development mein, { force: true } table drop karke recreate karta hai (data loss)
// Production mein sirf db.sequelize.sync() use karna.
db.sequelize.sync() // For now, no { force: true }
  .then(() => {
    console.log("Database synced successfully. 'users' table (and others) should be ready.");
    // Yahan hum initial data (like Super Admin) add karne ka function call kar sakte hain agar zaroorat ho
    // initialRoles(); // Example function to add roles if you have a separate Roles table
  })
  .catch((err) => {
    console.log("ERROR! Failed to sync database: " + err.message);
  });

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: "Welcome to the Inventory Management System backend!" });
});


// <<--- 2. CORS Middleware ko yahan use karo (saare routes se pehle)
app.use(cors()); 
// Default options sab origins ko allow karengi. Hum isko specific bhi kar sakte hain:
// app.use(cors({ origin: 'http://localhost:5173' })); // Sirf frontend ko allow karne ke liye

// Middleware to parse JSON request bodies
app.use(express.json());
// Middleware to parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: "Welcome to the Inventory Management System backend!" });
});


// Authentication routes
require('./routes/auth.routes')(app);

// User test routes for authorization
require('./routes/user.routes')(app);

// Yahan hum apne baaki routes (users, products, etc.) ko require karenge baad mein

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});