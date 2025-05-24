// backend/routes/website.routes.js
const controller = require("../controllers/website.controller.js");
const { authJwt } = require("../middleware"); // Assuming you want to protect these routes

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Create a new Website (Admin/SuperAdmin only)
  app.post(
    "/api/websites",
    [authJwt.verifyToken], // Only admins can create
    controller.create
  );

  // Retrieve all Websites (Logged-in users)
  app.get(
    "/api/websites",
    [authJwt.verifyToken], // Any logged-in user can view
    controller.findAll
  );

  // Retrieve a single Website with id (Logged-in users)
  app.get(
    "/api/websites/:id",
    [authJwt.verifyToken], // Any logged-in user can view
    controller.findOne
  );

  // Update a Website with id (Admin/SuperAdmin only)
  app.put(
    "/api/websites/:id",
    [authJwt.verifyToken], // Only admins can update
    controller.update
  );

  // Delete a Website with id (Admin/SuperAdmin only)
  app.delete(
    "/api/websites/:id",
    [authJwt.verifyToken, authJwt.isAdmin], // Only admins can delete
    controller.delete
  );

  // Optionally, you can add a route to delete all websites (SuperAdmin only, use with caution)
  app.delete(
    "/api/websites",
    [authJwt.verifyToken, authJwt.isSuperAdmin],
    controller.deleteAll
  );
};