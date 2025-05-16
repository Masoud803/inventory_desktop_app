// inventory-app/backend/routes/auth.routes.js
const controller = require("../controllers/auth.controller"); // Auth controller yahan import hoga

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
};