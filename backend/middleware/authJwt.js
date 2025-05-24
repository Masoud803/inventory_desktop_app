// inventory-app/backend/middleware/authJwt.js
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
// const db = require("../models");
// const User = db.user;

verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];
  console.log("AUTHJWT: Received token:", token);

  if (!token) {
    console.log("AUTHJWT: No token provided!");
    return res.status(403).send({
      message: "No token provided!"
    });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      console.error("AUTHJWT: Unauthorized! Token verification failed:", err.message);
      return res.status(401).send({
        message: "Unauthorized!"
      });
    }
    console.log("AUTHJWT: Token verified. Decoded ID:", decoded.id, "Decoded Role:", decoded.role);
    req.userId = decoded.id; // Save user id from token to request object
    req.username = decoded.username; // Save username from token to request object
    req.userRole = decoded.role; // Save user role from token to request object
    next();
  });
};

isAdmin = (req, res, next) => {
  // We rely on req.userRole being set by verifyToken middleware
  if (req.userRole && (req.userRole === 'admin' || req.userRole === 'super_admin')) {
    next();
    return;
  }
  res.status(403).send({
    message: "Require Admin or Super Admin Role!"
  });
};

isSuperAdmin = (req, res, next) => {
  // We rely on req.userRole being set by verifyToken middleware
  if (req.userRole && req.userRole === 'super_admin') {
    next();
    return;
  }
  res.status(403).send({
    message: "Require Super Admin Role!"
  });
};

const authJwt = {
  verifyToken: verifyToken,
  isAdmin: isAdmin,
  isSuperAdmin: isSuperAdmin
};
module.exports = authJwt;