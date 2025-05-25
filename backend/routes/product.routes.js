// backend/routes/product.routes.js
const controller = require("../controllers/product.controller.js");
const { authJwt } = require("../middleware/index.js");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // --- Product CRUD ---
  // Create a new Product (Logged-in users can create, Admin/SuperAdmin can manage)
  app.post("/api/products", [authJwt.verifyToken], controller.createProduct);
  // Retrieve all Products (Logged-in users, can add filters later)
  app.get("/api/products", [authJwt.verifyToken], controller.findAllProducts);
  // Retrieve a single Product with id (including its variations/accessories)
  app.get("/api/products/:productId", [authJwt.verifyToken], controller.findOneProduct);
  // Update a Product with id (Logged-in users can update, Admin/SuperAdmin can manage)
  app.put("/api/products/:productId", [authJwt.verifyToken], controller.updateProduct);
  // Delete a Product with id (Admin/SuperAdmin only)
  app.delete("/api/products/:productId", [authJwt.verifyToken, authJwt.isAdmin], controller.deleteProduct);

  // --- Variation Management for a Product (Logged in user can add product) ---
  // Add a Variation to a Product
  app.post("/api/products/:productId/variations", [authJwt.verifyToken], controller.addVariation);
  // Get all Variations for a Product
  app.get("/api/products/:productId/variations", [authJwt.verifyToken], controller.findAllVariationsForProduct); // Logged-in users can see
  // Update a specific Variation
  app.put("/api/variations/:variationId", [authJwt.verifyToken], controller.updateVariation);
  // Delete a specific Variation
  app.delete("/api/variations/:variationId", [authJwt.verifyToken, authJwt.isAdmin], controller.deleteVariation);

  // --- Accessory Management for a Product (Logged in user can manage) ---
  // Add an Accessory to a Product
  app.post("/api/products/:productId/accessories", [authJwt.verifyToken], controller.addAccessory);
  // Get all Accessories for a Product
  app.get("/api/products/:productId/accessories", [authJwt.verifyToken], controller.findAllAccessoriesForProduct); // Logged-in users can see
  // Update a specific Accessory
  app.put("/api/accessories/:accessoryId", [authJwt.verifyToken], controller.updateAccessory);
  // Delete a specific Accessory
  app.delete("/api/accessories/:accessoryId", [authJwt.verifyToken, authJwt.isAdmin], controller.deleteAccessory);
};