// backend/routes/user.routes.js
const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller.js"); // User controller for test boards
const adminUserController = require("../controllers/user.controller.js"); // Also for admin user management (can be same file)

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // --- Test Board Routes (as before) ---
  app.get("/api/test/all", controller.allAccess);
  app.get("/api/test/user", [authJwt.verifyToken], controller.userBoard);
  app.get("/api/test/admin", [authJwt.verifyToken, authJwt.isAdmin], controller.adminBoard);
  app.get("/api/test/super_admin", [authJwt.verifyToken, authJwt.isSuperAdmin], controller.superAdminBoard);


  // --- Admin Routes for User Management ---
  // (Assuming a base path like /api/admin/users or just /api/users for admin actions)
  // Let's use /api/users and protect them with isAdmin middleware

  // Get all users (Admin only)
  app.get(
    "/api/users",
    [authJwt.verifyToken, authJwt.isAdmin],
    adminUserController.findAllUsers
  );

  // Create a new user (Admin only)
  app.post(
    "/api/users",
    [authJwt.verifyToken, authJwt.isAdmin],
    adminUserController.createUserByAdmin
  );

  // Get a single user by ID (Admin only)
  app.get(
    "/api/users/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    adminUserController.findOneUser
  );

  // Update a user by ID (Admin only)
  app.put(
    "/api/users/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    adminUserController.updateUserByAdmin
  );

  // Delete a user by ID (Admin only)
  app.delete(
    "/api/users/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    adminUserController.deleteUserByAdmin
  );
};