// backend/routes/stockmovement.routes.js
const controller = require("../controllers/stockmovement.controller.js");
const { authJwt } = require("../middleware");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Retrieve all Stock Movements (Admin/SuperAdmin for all)
  app.get(
    "/api/stock/movements",
    [authJwt.verifyToken], 
    controller.findAllMovements
  );

  // Create a new Manual Stock Adjustment (Admin/SuperAdmin only)
  app.post(
    "/api/stock/adjustments",
    [authJwt.verifyToken],
    controller.createManualAdjustment
  );

  // Retrieve a specific Stock Movement by ID (Admin/SuperAdmin)
  app.get(
    "/api/stock/movements/:id",
    [authJwt.verifyToken],
    controller.findOneMovement
  );
};