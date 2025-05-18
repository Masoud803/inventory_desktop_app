// inventory-app/backend/middleware/authJwt.js
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.user;

verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!"
      });
    }
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