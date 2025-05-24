// backend/routes/category.routes.js
const controller = require("../controllers/category.controller.js");
const { authJwt } = require("../middleware/index.js");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Create a new Category (Logged-in users)
  app.post(
    "/api/categories",
    [authJwt.verifyToken],
    controller.create
  );

  // Retrieve all Categories (can be filtered by website_id) (Logged-in users)
  app.get(
    "/api/categories",
    [authJwt.verifyToken],
    controller.findAll
  );
  
  // Retrieve all Categories for a specific Website (Logged-in users)
  app.get(
    "/api/websites/:websiteId/categories",
    [authJwt.verifyToken],
    controller.findAllByWebsite // New controller method
  );

  // Retrieve a single Category with id (Logged-in users)
  app.get(
    "/api/categories/:id",
    [authJwt.verifyToken],
    controller.findOne
  );

  // Update a Category with id (Logged-in users)
  app.put(
    "/api/categories/:id",
    [authJwt.verifyToken],
    controller.update
  );

  // Delete a Category with id (Admin/SuperAdmin only)
  // (Consider what happens to sub-categories or products linked to this category)
  app.delete(
    "/api/categories/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.delete
  );
};