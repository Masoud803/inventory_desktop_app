// inventory-app/backend/controllers/auth.controller.js
const db = require("../models");
const User = db.user;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");

// Signup function
exports.signup = (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send({ message: "Failed! Username, email, and password are required." });
  }

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
          const passwordHash = bcrypt.hashSync(password, 8);
          User.create({
            username: username,
            email: email,
            password_hash: passwordHash
          })
          .then(user => {
            res.status(201).send({ message: "User registered successfully!" });
          })
          .catch(err => {
            console.error("ERROR in signup User.create:", err); // Added log
            res.status(500).send({ message: `Error creating user: ${err.message}` });
          });
        })
        .catch(err => {
          console.error("ERROR in signup User.findOne (email):", err); // Added log
          res.status(500).send({ message: `Error checking email: ${err.message}` });
        });
    })
    .catch(err => {
      console.error("ERROR in signup User.findOne (username):", err); // Added log
      res.status(500).send({ message: `Error checking username: ${err.message}` });
    });
};

// Signin function
exports.signin = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send({ message: "Failed! Username and password are required." });
  }
  User.findOne({ where: { username: username }})
    .then(user => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }
      const passwordIsValid = bcrypt.compareSync(password, user.password_hash);
      if (!passwordIsValid) {
        return res.status(401).send({ accessToken: null, message: "Invalid Password!" });
      }
      const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, config.secret, {
        expiresIn: 86400 // 24 hours
      });
      res.status(200).send({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        accessToken: token
      });
    })
    .catch(err => {
      console.error("ERROR in signin:", err); // Added log
      res.status(500).send({ message: err.message });
    });
};

// Update User's Own Profile
exports.updateProfile = async (req, res) => {
  const userId = req.userId; 
  const { email, username } = req.body;
  console.log(`--- Attempting Profile Update for User ID: ${userId} ---`);
  console.log("Request body for profile update:", req.body);

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      console.log(`User not found for ID: ${userId} in updateProfile`);
      return res.status(404).send({ message: "User not found." });
    }
    console.log(`User found: ${user.username}, current email: ${user.email}`);

    let changed = false;
    if (email && email !== user.email) {
      console.log(`Attempting to update email to: ${email}`);
      const existingEmail = await User.findOne({ where: { email: email } });
      if (existingEmail && existingEmail.id !== userId) {
        console.log(`Email ${email} already in use by another account.`);
        return res.status(400).send({ message: "Failed! Email is already in use by another account." });
      }
      user.email = email;
      changed = true;
    }
    if (username && username !== user.username) {
      console.log(`Attempting to update username to: ${username}`);
      const existingUsername = await User.findOne({ where: { username: username } });
      if (existingUsername && existingUsername.id !== userId) {
        console.log(`Username ${username} already in use by another account.`);
        return res.status(400).send({ message: "Failed! Username is already in use by another account." });
      }
      user.username = username;
      changed = true;
    }

    if (changed) {
      await user.save();
      console.log(`Profile updated successfully for User ID: ${userId}`);
      res.status(200).send({ message: "Profile updated successfully!" });
    } else {
      console.log(`No changes to profile for User ID: ${userId}`);
      res.status(200).send({ message: "No changes detected in profile." }); // Or 304 Not Modified
    }

  } catch (error) {
    console.error("Detailed error in updateProfile:", error); // DETAILED LOG
    res.status(500).send({ message: error.message || "Error updating profile." });
  }
};

// Change User's Own Password
exports.changePassword = async (req, res) => {
  const userId = req.userId;
  const { currentPassword, newPassword } = req.body;
  console.log(`--- Attempting Password Change for User ID: ${userId} ---`);

  if (!currentPassword || !newPassword) {
    return res.status(400).send({ message: "Current password and new password are required." });
  }
  if (newPassword.length < 6) {
    return res.status(400).send({ message: "New password must be at least 6 characters long." });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      console.log(`User not found for ID: ${userId} in changePassword`);
      return res.status(404).send({ message: "User not found." });
    }

    const passwordIsValid = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!passwordIsValid) {
      console.log(`Invalid current password for User ID: ${userId}`);
      return res.status(401).send({ message: "Invalid current password!" });
    }

    user.password_hash = bcrypt.hashSync(newPassword, 8);
    await user.save();
    console.log(`Password changed successfully for User ID: ${userId}`);
    res.status(200).send({ message: "Password changed successfully!" });

  } catch (error) {
    console.error("Detailed error in changePassword:", error); // DETAILED LOG
    res.status(500).send({ message: error.message || "Error changing password." });
  }
};