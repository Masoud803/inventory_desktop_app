// inventory-app/backend/app.js
const express = require('express');
const cors = require('cors'); // CORS ko require karo
const app = express();

const PORT = process.env.PORT || 3001;

// --- Middleware ---

// 1. Global Logger (Yeh bilkul theek hai shuru mein)
app.use((req, res, next) => {
  console.log(`INCOMING REQUEST: ${req.method} ${req.originalUrl}`);
  // Agar headers log karne hain toh uncomment kar sakte ho, par abhi ke liye rehne dete hain
  // console.log("Request Headers:", JSON.stringify(req.headers, null, 2)); 
  next();
});

// 2. CORS Configuration (Updated and Structured)
const corsOptions = {
  origin: "http://localhost:5173", // Tumhara frontend origin
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "x-access-token, Origin, Content-Type, Accept",
  credentials: true,
  optionsSuccessStatus: 204 // Standard for preflight success
};
app.use(cors(corsOptions)); // Apply CORS options to all routes

// 3. Body Parsers (CORS ke baad, aur routes se pehle)
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


// --- Database Setup ---
const db = require("./models"); // Hamara models/index.js
db.sequelize.sync({ alter: true }) // For now, no { force: true }
  .then(() => {
    console.log("Database synced successfully. Tables should be ready.");
    // Yahan hum initial data (like Super Admin) add karne ka function call kar sakte hain agar zaroorat ho
    // initialRoles(); // Example function to add roles if you have a separate Roles table
  })
  .catch((err) => {
    console.log("ERROR! Failed to sync database: " + err.message);
  });


// --- Routes ---

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: "Welcome to the Inventory Management System backend!" });
});

// Application Routes
require('./routes/auth.routes')(app); 
require('./routes/user.routes')(app); // For user management by admin & test boards
require('./routes/website.routes')(app);
require('./routes/supplier.routes')(app);
require('./routes/category.routes')(app);
require('./routes/product.routes')(app); // Ensure product routes are included here
require('./routes/stockmovement.routes')(app);

// Yahan pehle comment tha "Yahan hum apne baaki routes (users, products, etc.) ko require karenge baad mein"
// Ab humne saare current routes (auth, user, website, supplier, category, product) include kar diye hain.


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});