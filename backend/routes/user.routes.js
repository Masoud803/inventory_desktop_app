// inventory-app/backend/routes/user.routes.js
const { authJwt } = require("../middleware"); // index.js in middleware will export this
const controller = require("../controllers/user.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Publicly accessible route
  app.get("/api/test/all", controller.allAccess);

  // Route accessible only by logged-in users (any role)
  app.get(
    "/api/test/user",
    [authJwt.verifyToken], // Token verify hoga
    controller.userBoard
  );

  // Route accessible only by admin or super_admin
  app.get(
    "/api/test/admin",
    [authJwt.verifyToken, authJwt.isAdmin], // Token verify hoga, phir role check
    controller.adminBoard
  );

  // Route accessible only by super_admin
  app.get(
    "/api/test/super_admin",
    [authJwt.verifyToken, authJwt.isSuperAdmin], // Token verify hoga, phir role check
    controller.superAdminBoard
  );
};