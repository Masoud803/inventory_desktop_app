// backend/models/accessory.model.js
module.exports = (sequelize, Sequelize) => {
  const Accessory = sequelize.define("accessory", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // product_id will be added via association
    name: { // Name of the accessory/addon e.g., "LED Lights", "Motor Type A"
      type: Sequelize.STRING,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    price: { // Price of this specific accessory/addon
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    stock_impact: { // How much main product stock this accessory consumes (if any, can be 0)
                     // Or, if accessories have their own stock, add a stock_quantity field here
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0 
    }
    // We can add more fields later like 'is_default', 'is_required' etc.
  });

  return Accessory;
};