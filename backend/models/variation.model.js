// backend/models/variation.model.js
module.exports = (sequelize, Sequelize) => {
  const Variation = sequelize.define("variation", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // product_id will be added via association
    attribute_name: { // e.g., "Color", "Size"
      type: Sequelize.STRING,
      allowNull: false
    },
    attribute_value: { // e.g., "Red", "M"
      type: Sequelize.STRING,
      allowNull: false
    },
    additional_price: { // Price difference from base product price for this variation
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    sku_suffix: { // Optional: To create a unique SKU for the variation (e.g., main_sku + suffix)
      type: Sequelize.STRING,
      allowNull: true
    },
    stock_quantity: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
    // Add other variation-specific fields if needed (e.g., image)
  });

  return Variation;
};