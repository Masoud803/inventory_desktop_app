// inventory-app/backend/controllers/auth.controller.js
const db = require("../models");
const User = db.user;
// const Role = db.role; // Agar Role model alag se banaya
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");

// Signup function
exports.signup = (req, res) => {
  const { username, email, password } = req.body;

  // Basic Input Validation
  if (!username || !email || !password) {
    return res.status(400).send({ message: "Failed! Username, email, and password are required." });
  }

  // Check if username or email already exists
  User.findOne({ where: { username: username } })
    .then(userByUsername => {
      if (userByUsername) {
        return res.status(400).send({ message: "Failed! Username is already in use!" });
      }

      User.findOne({ where: { email: email } })
        .then(userByEmail => {
          if (userByEmail) {
            return res.status(400).send({ message: "Failed! Email is already in use!" });
          }

          // If username and email are unique, proceed to hash password and create user:
          // Hash the password
          const passwordHash = bcrypt.hashSync(password, 8); // 8 salt rounds

          // Create a new user object
          User.create({
            username: username,
            email: email,
            password_hash: passwordHash
            // 'role' will use the default 'user' as defined in the model
          })
          .then(user => {
            // Send success response
            res.status(201).send({ message: "User registered successfully!" });
            // Optionally, you could send back some user data (but NOT the password_hash)
            // For example: res.status(201).send({ id: user.id, username: user.username, email: user.email, role: user.role });
          })
          .catch(err => {
            // Handle errors during user creation
            res.status(500).send({ message: `Error creating user: ${err.message}` });
          });
        })
        .catch(err => {
          // Handle errors from email findOne
          res.status(500).send({ message: `Error checking email: ${err.message}` });
        });
    })
    .catch(err => {
      // Handle errors from username findOne
      res.status(500).send({ message: `Error checking username: ${err.message}` });
    });
};


// Signin function
exports.signin = (req, res) => {
  const { username, password } = req.body; // User can sign in with username

  // Basic Input Validation
  if (!username || !password) {
    return res.status(400).send({ message: "Failed! Username and password are required." });
  }

  User.findOne({
    where: {
      username: username
    }
  })
  .then(user => {
    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    // Compare password with the stored hash
    const passwordIsValid = bcrypt.compareSync(
      password,
      user.password_hash
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!"
      });
    }

    // If password is valid, generate a JWT token
    const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, config.secret, {
      expiresIn: 86400 // 24 hours (in seconds) - token kab expire hoga
    });

    // Send response with user details and token
    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      accessToken: token
    });
  })
  .catch(err => {
    res.status(500).send({ message: err.message });
  });
};