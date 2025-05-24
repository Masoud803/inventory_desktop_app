// inventory-app/backend/app.js

const express = require('express');
const app = express();
const cors = require('cors'); // <<--- 1. CORS ko require karo
const PORT = process.env.PORT || 3001; // Backend server is port pe chalega

// <<--- YEH GLOBAL LOGGER MIDDLEWARE ADD KARO ---<<
app.use((req, res, next) => {
  console.log(`INCOMING REQUEST: ${req.method} ${req.originalUrl}`);
  console.log("Request Headers:", JSON.stringify(req.headers, null, 2)); // Log all headers
  next();
});
// >>--- YAHAN TAK ADD KARO ---<<

// <<--- 2. CORS Middleware ko yahan use karo (saare routes se pehle)
// app.use(cors()); 
app.use(cors({
  origin: "*", // Allow all origins
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allow all methods
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
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
// Website routes
require('./routes/website.routes')(app);
// Supplier routes
require('./routes/supplier.routes')(app);
// Category routes
require('./routes/category.routes')(app);

// Yahan hum apne baaki routes (users, products, etc.) ko require karenge baad mein

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

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});