// inventory-app/backend/models/user.model.js
module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("user", { // Table name in the database will be 'users'
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true // Each username must be unique
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true, // Each email must be unique
      validate: {
        isEmail: true // Sequelize will validate the email format
      }
    },
    password_hash: { // We will store the hashed password here
      type: Sequelize.STRING,
      allowNull: false
    },
    role: {
      type: Sequelize.ENUM('super_admin', 'admin', 'user'), // Roles as per your plan
      defaultValue: 'user', // Default role will be 'user'
      allowNull: false
    }
    // createdAt and updatedAt columns will be added automatically by Sequelize
  });

  return User;
};