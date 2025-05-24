// backend/models/website.model.js
module.exports = (sequelize, Sequelize) => {
  const Website = sequelize.define("website", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true // Assuming website names should be unique
    },
    url: {
      type: Sequelize.STRING,
      allowNull: true, // URL can be optional initially
      validate: {
        isUrl: true // Optional: validates if it's a URL
      }
    },
    description: {
      type: Sequelize.TEXT, // For longer text
      allowNull: true
    }
    // createdAt and updatedAt will be added by Sequelize automatically
  });

  return Website;
};