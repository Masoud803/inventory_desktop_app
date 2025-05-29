// inventory-app/backend/config/db.config.js
module.exports = {
  HOST: "localhost", // Aapka MySQL host (usually "localhost")
  USER: "Masaood",      // Aapka MySQL username
  PASSWORD: "Khaann786!!@@##", // Aapka MySQL password (isko zaroor change karna)
  DB: "inventory_db", // Aapke database ka naam (yeh database MySQL mein create karna hoga)
  dialect: "mysql",
  pool: { // Optional: Connection pooling settings
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};