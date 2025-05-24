// backend/models/supplier.model.js
module.exports = (sequelize, Sequelize) => {
  const Supplier = sequelize.define("supplier", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    contact_person: {
      type: Sequelize.STRING,
      allowNull: true
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: true
    },
    email: {
      type: Sequelize.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    address: {
      type: Sequelize.TEXT,
      allowNull: true
    }
    // createdAt and updatedAt will be added by Sequelize automatically
  });

  return Supplier;
};