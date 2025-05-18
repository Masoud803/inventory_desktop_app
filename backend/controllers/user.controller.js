// inventory-app/backend/controllers/user.controller.js
exports.allAccess = (req, res) => {
  res.status(200).send("Public Content - Anyone can access this.");
};

exports.userBoard = (req, res) => {
  res.status(200).send(`User Content - Hello ${req.username} (ID: ${req.userId}, Role: ${req.userRole}).`);
};

exports.adminBoard = (req, res) => {
  res.status(200).send(`Admin Content - Hello ${req.username} (ID: ${req.userId}, Role: ${req.userRole}).`);
};

exports.superAdminBoard = (req, res) => {
  res.status(200).send(`Super Admin Content - Hello ${req.username} (ID: ${req.userId}, Role: ${req.userRole}).`);
};