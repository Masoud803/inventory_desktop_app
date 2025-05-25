// backend/models/product.model.js
module.exports = (sequelize, Sequelize) => {
  const Product = sequelize.define("product", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    sku: { // Stock Keeping Unit
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    product_type: { // 'simple', 'variable', 'customisable'
      type: Sequelize.ENUM('simple', 'variable', 'customisable'),
      allowNull: false,
      defaultValue: 'simple'
    },
    // For 'simple' products, these are the main price/stock
    // For 'variable'/'customisable', these might be base price/total stock, or might be derived
    base_price: {
      type: Sequelize.DECIMAL(10, 2), // Example: 12345678.90
      allowNull: true // Might be null if price is only on variations/accessories
    },
    current_stock: {
      type: Sequelize.INTEGER,
      allowNull: true, // Might be null if stock is managed per variation/accessory
      defaultValue: 0
    },
    // Foreign Keys will be added via associations for:
    // website_id, category_id, supplier_id
    // COGS, Media links - can be added later or as simple fields for now
    cost_of_goods: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
    },
    // We can add promo_price, promo_start, promo_end later if needed for Phase 4
    // For now, keeping it simpler.
  });

  return Product;
};