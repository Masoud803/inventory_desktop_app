// inventory-app/backend/models/index.js
const dbConfig = require("../config/db.config.js"); // Path to your db.config.js
const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: 0, // Use 0 or false for Sequelize v5+
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Yahan hum apne models ko import aur initialize karenge (e.g., User model)
db.user = require("./user.model.js")(sequelize, Sequelize); 
// Abhi ke liye User model wali line ko comment rakhte hain, jab tak hum user.model.js file nahi banate.

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('SUCCESS! Connection to database has been established successfully.');
  })
  .catch(err => {
    console.error('ERROR! Unable to connect to the database:', err);
  });

module.exports = db;