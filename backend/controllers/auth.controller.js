// inventory-app/backend/controllers/auth.controller.js
const db = require("../models");
const User = db.user;
// const Role = db.role; // Agar Role model alag se banaya
const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken"); // JWT baad mein add karenge
// const config = require("../config/auth.config"); // Auth config (secret key etc.) baad mein

exports.signup = (req, res) => {
  // TODO: Signup logic yahan aayega
  // 1. Request body se username, email, password, role (optional) extract karo
  // 2. Check karo ke username/email pehle se exist toh nahi karte
  // 3. Password ko bcrypt se hash karo
  // 4. User ko database mein save karo
  res.status(501).send({ message: "Signup endpoint - Not Implemented Yet." });
};

exports.signin = (req, res) => {
  // TODO: Signin logic yahan aayega
  // 1. Request body se username/email aur password extract karo
  // 2. User ko database se find karo
  // 3. Password compare karo bcrypt se
  // 4. Agar aab theek hai, toh JWT generate karke send karo
  res.status(501).send({ message: "Signin endpoint - Not Implemented Yet." });
};