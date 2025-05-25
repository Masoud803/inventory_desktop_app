// backend/routes/auth.routes.js
const controller = require("../controllers/auth.controller.js");
const { authJwt } = require("../middleware"); // authJwt middleware yahan zaroori hai

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post("/api/auth/signup", controller.signup); // Signup route
  app.post("/api/auth/signin", controller.signin); // Signin route

  // <<--- YEH DO NAYE ROUTES ADD KARO ---<<
  // Update current user's profile details
  app.put(
    "/api/auth/profile",
    [authJwt.verifyToken], // User must be logged in
    controller.updateProfile 
  );

  // Change current user's password
  app.post(
    "/api/auth/change-password",
    [authJwt.verifyToken], // User must be logged in
    controller.changePassword
  );
  // >>--- YAHAN TAK ADD KARO ---<<
};