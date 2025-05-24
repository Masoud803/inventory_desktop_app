// backend/routes/supplier.routes.js
const controller = require("../controllers/supplier.controller.js");
const { authJwt } = require("../middleware/index.js");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Create a new Supplier (Logged-in users)
  app.post(
    "/api/suppliers",
    [authJwt.verifyToken],
    controller.create
  );

  // Retrieve all Suppliers (Logged-in users)
  app.get(
    "/api/suppliers",
    [authJwt.verifyToken],
    controller.findAll
  );

  // Retrieve a single Supplier with id (Logged-in users)
  app.get(
    "/api/suppliers/:id",
    [authJwt.verifyToken],
    controller.findOne
  );

  // Update a Supplier with id (Logged-in users)
  app.put(
    "/api/suppliers/:id",
    [authJwt.verifyToken],
    controller.update
  );

  // Delete a Supplier with id (Admin/SuperAdmin only)
  app.delete(
    "/api/suppliers/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.delete
  );

  // --- Routes for managing Website-Supplier associations ---
  // Add a Website to a Supplier (Admin/SuperAdmin only)
  app.post(
    "/api/suppliers/:supplierId/websites",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.addWebsiteToSupplier
  );

  // Get all Websites for a Supplier (Logged-in users)
  app.get(
    "/api/suppliers/:supplierId/websites",
    [authJwt.verifyToken],
    controller.findSupplierWebsites
  );
  
  // Remove a Website from a Supplier (Admin/SuperAdmin only)
  app.delete(
    "/api/suppliers/:supplierId/websites/:websiteId",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.removeWebsiteFromSupplier
  );
};