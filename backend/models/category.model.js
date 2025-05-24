// backend/models/category.model.js
module.exports = (sequelize, Sequelize) => {
  const Category = sequelize.define("category", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    // parent_id for self-referencing (sub-categories)
    // This will be set up via associations in models/index.js
  });

  return Category;
};