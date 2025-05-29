// backend/models/stockmovement.model.js
module.exports = (sequelize, Sequelize) => {
  const StockMovement = sequelize.define("stock_movement", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // foreign keys (productId, variationId, accessoryId, userId) 
    // will be automatically added by Sequelize via associations defined in models/index.js
    movement_type: { 
      type: Sequelize.STRING,
      allowNull: false
    },
    quantity_changed: { 
      type: Sequelize.INTEGER,
      allowNull: false
    },
    remarks: { 
      type: Sequelize.TEXT,
      allowNull: true
    }
    // createdAt and updatedAt are automatically added by Sequelize
  });
  return StockMovement;
};


// // backend/models/stockmovement.model.js
// module.exports = (sequelize, Sequelize) => {
//   const StockMovement = sequelize.define("stock_movement", {
//     id: {
//       type: Sequelize.INTEGER,
//       primaryKey: true,
//       autoIncrement: true
//     },
//     // Foreign Key for Product
//     // Sequelize will automatically create this column as 'productId' if not specified here,
//     // when we define the association 'StockMovement.belongsTo(db.product)'.
//     // However, explicitly defining it here gives more control and clarity.
//     // If you define it here, ensure the name matches the 'foreignKey' option in models/index.js
//     productId: { // Matches the 'productId' key Sequelize looks for
//       type: Sequelize.INTEGER,
//       allowNull: true, // A movement might be for a variation or accessory instead of a direct product
//       references: {
//         model: 'products', // Name of the target table (usually plural of model name)
//         key: 'id'
//       },
//       onDelete: 'SET NULL', // If product is deleted, set this FK to null in stock_movements
//       onUpdate: 'CASCADE'  // If product id changes, update it here too
//     },
//     variationId: {
//       type: Sequelize.INTEGER,
//       allowNull: true,
//       references: {
//         model: 'variations', 
//         key: 'id'
//       },
//       onDelete: 'SET NULL',
//       onUpdate: 'CASCADE'
//     },
//     accessoryId: {
//       type: Sequelize.INTEGER,
//       allowNull: true,
//       references: {
//         model: 'accessories', 
//         key: 'id'
//       },
//       onDelete: 'SET NULL',
//       onUpdate: 'CASCADE'
//     },
//     userId: { // User who performed or is responsible for the movement
//       type: Sequelize.INTEGER,
//       allowNull: true, // Could be null for system-generated movements
//       references: {
//         model: 'users', 
//         key: 'id'
//       },
//       onDelete: 'SET NULL',
//       onUpdate: 'CASCADE'
//     },
//     movement_type: { 
//       type: Sequelize.STRING,
//       allowNull: false
//     },
//     quantity_changed: { 
//       type: Sequelize.INTEGER,
//       allowNull: false
//     },
//     remarks: { 
//       type: Sequelize.TEXT,
//       allowNull: true
//     }
//     // createdAt and updatedAt are automatically added by Sequelize
//   });

//   // Associations will be defined in models/index.js
//   // StockMovement.associate = function(models) {
//   //   StockMovement.belongsTo(models.product, { foreignKey: 'productId', as: 'product' });
//   //   StockMovement.belongsTo(models.variation, { foreignKey: 'variationId', as: 'variation' });
//   //   StockMovement.belongsTo(models.accessory, { foreignKey: 'accessoryId', as: 'accessory' });
//   //   StockMovement.belongsTo(models.user, { foreignKey: 'userId', as: 'user' });
//   // };

//   return StockMovement;
// };