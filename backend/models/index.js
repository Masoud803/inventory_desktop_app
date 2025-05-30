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
// Importing user models
db.user = require("./user.model.js")(sequelize, Sequelize); 
//Importing website model
db.website = require("./website.model.js")(sequelize, Sequelize);
// Importing supplier model
db.supplier = require("./supplier.model.js")(sequelize, Sequelize);
// Importing category model
db.category = require("./category.model.js")(sequelize, Sequelize);
//Product, Variation, Accessory models
db.product = require("./product.model.js")(sequelize, Sequelize);
db.variation = require("./variation.model.js")(sequelize, Sequelize);
db.accessory = require("./accessory.model.js")(sequelize, Sequelize);

// Define Many-to-Many relationship between Website and Supplier
// This will create a junction table e.g., 'website_suppliers'
db.website.belongsToMany(db.supplier, {
  through: "website_suppliers", // Name of the junction table
  as: "suppliers", // Alias to access suppliers from website instance
  foreignKey: "website_id",
});
db.supplier.belongsToMany(db.website, {
  through: "website_suppliers", // Must be the same junction table name
  as: "websites", // Alias to access websites from supplier instance
  foreignKey: "supplier_id",
});

// Define Associations for Category:
// 1. Category belongs to ONE Website (One-to-Many: Website has Many Categories)
db.website.hasMany(db.category, { as: "categories", foreignKey: { name: 'website_id', allowNull: false }, onDelete: 'RESTRICT' });
db.category.belongsTo(db.website, {
  as: "website",
  foreignKey: { name: 'website_id', allowNull: false }
});

// 2. Category can have a Parent Category (Self-referencing for sub-categories)
// A category can have one parent, and a parent can have many children.
db.category.belongsTo(db.category, { as: 'parentCategory', foreignKey: 'parent_id', allowNull: true, onDelete: 'SET NULL' });
db.category.hasMany(db.category, { as: 'subCategories', foreignKey: 'parent_id', allowNull: true });


db.website.hasMany(db.product, { as: "products", foreignKey: { name: 'website_id', allowNull: true }, onDelete: 'SET NULL' }); // Or RESTRICT if website is mandatory
db.product.belongsTo(db.website, { as: "website", foreignKey: { name: 'website_id', allowNull: true }});

// Product belongs to ONE Category
db.category.hasMany(db.product, { as: "products", foreignKey: { name: 'category_id', allowNull: true }, onDelete: 'SET NULL' }); // Or RESTRICT
db.product.belongsTo(db.category, { as: "category", foreignKey: { name: 'category_id', allowNull: true }});

// Product belongs to ONE Supplier
db.supplier.hasMany(db.product, { as: "products", foreignKey: { name: 'supplier_id', allowNull: true }, onDelete: 'SET NULL' }); // Or RESTRICT
db.product.belongsTo(db.supplier, { as: "supplier", foreignKey: { name: 'supplier_id', allowNull: true }});

// Product (if 'variable' type) has MANY Variations
db.product.hasMany(db.variation, { as: "variations", foreignKey: { name: 'product_id', allowNull: false }, onDelete: 'CASCADE' });
db.variation.belongsTo(db.product, { as: "product", foreignKey: { name: 'product_id', allowNull: false }});

// Product (if 'customisable' type) has MANY Accessories
db.product.hasMany(db.accessory, { as: "accessories", foreignKey: { name: 'product_id', allowNull: false }, onDelete: 'CASCADE' });
db.accessory.belongsTo(db.product, { as: "product", foreignKey: { name: 'product_id', allowNull: false }});

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('SUCCESS! Connection to database has been established successfully.');
  })
  .catch(err => {
    console.error('ERROR! Unable to connect to the database:', err);
  });

module.exports = db;