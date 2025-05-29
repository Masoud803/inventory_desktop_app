// backend/controllers/stockmovement.controller.js
const db = require("../models");
const StockMovement = db.stock_movement;
const Product = db.product;
const Variation = db.variation;
const Accessory = db.accessory;
const User = db.user;
const Op = db.Sequelize.Op;

// Helper function to update actual stock and log movement
async function updateStockAndLog(productId, variationId, accessoryId, movementType, quantityChanged, remarks, userId, transaction) {
  let itemType = '';
  let itemId = null;
  let currentItemStock = 0;
  let parentProductId = null; // To store product_id for variations/accessories movements

  console.log(`Attempting to update stock & log: pId=${productId}, vId=${variationId}, accId=${accessoryId}, type=${movementType}, qtyChg=${quantityChanged}`);

  if (variationId) {
    itemType = 'Variation';
    itemId = variationId;
    const variation = await Variation.findByPk(variationId, { transaction });
    if (!variation) throw new Error(`Variation with id=${variationId} not found.`);
    currentItemStock = variation.stock_quantity;
    parentProductId = variation.productId; // Sequelize default FK name or from your model

    const newStock = currentItemStock + quantityChanged;
    if (newStock < 0) throw new Error(`Stock for variation id=${variationId} cannot go below zero (Attempted: ${newStock}).`);
    
    await Variation.update({ stock_quantity: newStock }, { where: { id: variationId }, transaction });
    await StockMovement.create({
      variationId: variationId, // Ensure this matches the FK column name in stock_movements table
      productId: parentProductId,  // Log parent product's ID
      movement_type: movementType,
      quantity_changed: quantityChanged,
      remarks: remarks,
      userId: userId // Ensure this matches FK column name
    }, { transaction });

  } else if (accessoryId) {
    itemType = 'Accessory';
    itemId = accessoryId;
    const accessory = await Accessory.findByPk(accessoryId, { include: [{model: Product, as: 'product'}] , transaction }); // Include product to get product_id
    if (!accessory) throw new Error(`Accessory with id=${accessoryId} not found.`);
    
    if (accessory.stock_quantity === undefined) { // Assuming Accessory model has 'stock_quantity'
        await transaction.rollback();
        throw new Error(`Accessory model (id=${accessoryId}) does not have 'stock_quantity' field.`);
    }
    currentItemStock = accessory.stock_quantity;
    parentProductId = accessory.productId; // Sequelize default FK name or from your model

    const newStock = currentItemStock + quantityChanged;
    if (newStock < 0) throw new Error(`Stock for accessory id=${accessoryId} cannot go below zero (Attempted: ${newStock}).`);

    await Accessory.update({ stock_quantity: newStock }, { where: { id: accessoryId }, transaction });
    await StockMovement.create({
      accessoryId: accessoryId, // Ensure this matches the FK column name
      productId: parentProductId,   // Log parent product's ID
      movement_type: movementType,
      quantity_changed: quantityChanged,
      remarks: remarks,
      userId: userId // Ensure this matches FK column name
    }, { transaction });

  } else if (productId) { 
    itemType = 'Product (Simple)';
    itemId = productId;
    const product = await Product.findByPk(productId, { transaction });
    if (!product) throw new Error(`Product with id=${productId} not found.`);
    if (product.product_type !== 'simple') {
        throw new Error(`Direct stock adjustments for non-simple product id=${productId} should target its variations/accessories.`);
    }
    currentItemStock = product.current_stock;
    parentProductId = productId; // It is its own parent for logging consistency
    
    const newStock = currentItemStock + quantityChanged;
    if (newStock < 0) throw new Error(`Stock for product id=${productId} cannot go below zero (Attempted: ${newStock}).`);
    
    await Product.update({ current_stock: newStock }, { where: { id: productId }, transaction });
    await StockMovement.create({
      productId: productId, // Ensure this matches the FK column name
      movement_type: movementType,
      quantity_changed: quantityChanged,
      remarks: remarks,
      userId: userId // Ensure this matches FK column name
    }, { transaction });
  } else {
    throw new Error("Either productId, variationId, or accessoryId must be provided for stock movement.");
  }
  console.log(`Stock updated & logged for ${itemType} ID ${itemId}. ParentProdID: ${parentProductId}. Type: ${movementType}, QtyChg: ${quantityChanged}, OldStock: ${currentItemStock}, NewStock: ${currentItemStock + quantityChanged}`);
}

// Create a Manual Stock Adjustment
exports.createManualAdjustment = async (req, res) => {
  const { product_id, variation_id, accessory_id, movement_type, quantity, remarks } = req.body;
  const userId = req.userId; 

  if (!movement_type || !['adjustment_in', 'adjustment_out', 'initial_stock', 'damaged', 'sale_adj', 'return_adj'].includes(movement_type)) {
    return res.status(400).send({ message: "Invalid or missing movement_type." });
  }
  const numQuantity = parseInt(quantity);
  if (isNaN(numQuantity) || numQuantity <= 0) {
    return res.status(400).send({ message: "Quantity must be a positive number." });
  }
  
  const pId = product_id ? parseInt(product_id) : null;
  const vId = variation_id ? parseInt(variation_id) : null;
  const accId = accessory_id ? parseInt(accessory_id) : null;

  if (!pId && !vId && !accId) {
    return res.status(400).send({ message: "At least one of product_id, variation_id, or accessory_id is required." });
  }
  const idsProvidedCount = [pId, vId, accId].filter(Boolean).length;
  if (idsProvidedCount > 1 && !(vId && pId && !accId) && !(accId && pId && !vId) ) { // Allow product_id with variation_id or accessory_id for context
      if(vId && pId && accId) return res.status(400).send({ message: "Provide only one of: product_id (for simple), variation_id (with its product_id if needed by helper), or accessory_id (with its product_id if needed by helper)."});
      if((vId && accId)) return res.status(400).send({message: "Cannot adjust stock for a variation and an accessory simultaneously in one adjustment."});
      // The helper function `updateStockAndLog` is structured to prioritize variationId, then accessoryId, then productId.
      // If product_id is for a simple product, variation_id and accessory_id should be null.
  }


  const quantityChanged = ['adjustment_in', 'initial_stock', 'return_adj'].includes(movement_type)
                          ? numQuantity 
                          : -numQuantity;

  const t = await db.sequelize.transaction(); 
  try {
    await updateStockAndLog(pId, vId, accId, movement_type, quantityChanged, remarks, userId, t);
    await t.commit(); 
    res.status(201).send({ message: "Stock adjustment successful." });
  } catch (err) {
    await t.rollback(); 
    console.error("Error in createManualAdjustment:", err.message, err.stack);
    res.status(500).send({ message: err.message || "Error creating stock adjustment." });
  }
};

// Retrieve all Stock Movements (with filters)
exports.findAllMovements = async (req, res) => {
  const { 
    productId: queryProductId, 
    variationId: queryVariationId, 
    accessoryId: queryAccessoryId, 
    movementType, 
    userId: queryUserId, 
    startDate, 
    endDate 
  } = req.query;
  
  let whereClause = {};
  
  // Ensure these keys match the foreign key field names in your StockMovement model as Sequelize sees them
  // (usually camelCase if Sequelize auto-generates them from associations: productId, variationId, etc.)
  if (queryProductId) whereClause.productId = queryProductId;     
  if (queryVariationId) whereClause.variationId = queryVariationId;   
  if (queryAccessoryId) whereClause.accessoryId = queryAccessoryId;   
  if (movementType) whereClause.movement_type = { [Op.like]: `%${movementType}%` }; // Allows partial match
  if (queryUserId) whereClause.userId = queryUserId;                 

  if (startDate && endDate) {
    const sDate = new Date(startDate);
    sDate.setHours(0,0,0,0);
    const eDate = new Date(endDate);
    eDate.setHours(23,59,59,999);
    whereClause.createdAt = { [Op.between]: [sDate, eDate] };
  } else if (startDate) {
    const sDate = new Date(startDate);
    sDate.setHours(0,0,0,0);
    whereClause.createdAt = { [Op.gte]: sDate };
  } else if (endDate) {
    const eDate = new Date(endDate);
    eDate.setHours(23,59,59,999);
    whereClause.createdAt = { [Op.lte]: eDate };
  }
  
  try {
    const movements = await StockMovement.findAll({
      where: whereClause,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }, // 'product' is the alias from StockMovement.belongsTo(db.product, { as: 'product'})
        { model: Variation, as: 'variation', attributes: ['id', 'attribute_name', 'attribute_value', 'product_id'] },
        { model: Accessory, as: 'accessory', attributes: ['id', 'name', 'product_id'] },
        { model: User, as: 'user', attributes: ['id', 'username'] } // 'user' is the alias from StockMovement.belongsTo(db.user, { as: 'user'})
      ],
      order: [['createdAt', 'DESC']]
    });
    res.send(movements);
  } catch (err) {
    console.error("Error in findAllMovements:", err.message, err.stack);
    res.status(500).send({ message: err.message || "Error retrieving stock movements." });
  }
};

// Find a single Stock Movement with an id
exports.findOneMovement = (req, res) => {
  const id = req.params.id;
  StockMovement.findByPk(id, {
    include: [
      { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
      { model: Variation, as: 'variation', attributes: ['id', 'attribute_name', 'attribute_value', 'product_id'] },
      { model: Accessory, as: 'accessory', attributes: ['id', 'name', 'product_id'] },
      { model: User, as: 'user', attributes: ['id', 'username'] }
    ]
  })
  .then(data => {
    if (data) {
      res.send(data);
    } else {
      res.status(404).send({ message: `Stock Movement with id=${id} not found.` });
    }
  })
  .catch(err => {
    console.error("Error in findOneMovement for ID " + id + ":", err.message, err.stack);
    res.status(500).send({ message: "Error retrieving Stock Movement with id=" + id });
  });
};








// // backend/controllers/stockmovement.controller.js
// const db = require("../models");
// const StockMovement = db.stock_movement;
// const Product = db.product;
// const Variation = db.variation;
// const Accessory = db.accessory; // Ensure Accessory model is imported
// const User = db.user;
// const Op = db.Sequelize.Op;

// // Helper function to update actual stock and log movement
// async function updateStockAndLog(productId, variationId, accessoryId, movementType, quantityChanged, remarks, userId, transaction) {
//   let itemType = '';
//   let itemId = null;
//   let currentItemStock = 0; // To check against negative stock

//   console.log(`updateStockAndLog called with: pId=${productId}, vId=${variationId}, accId=${accessoryId}, type=${movementType}, qtyChg=${quantityChanged}`);


//   if (variationId) {
//     itemType = 'Variation';
//     itemId = variationId;
//     const variation = await Variation.findByPk(variationId, { transaction });
//     if (!variation) throw new Error(`Variation with id=${variationId} not found.`);
//     currentItemStock = variation.stock_quantity;

//     const newStock = variation.stock_quantity + quantityChanged;
//     if (newStock < 0) throw new Error(`Stock for variation id=${variationId} cannot go below zero (Attempted: ${newStock}, Change: ${quantityChanged}, Old: ${currentItemStock}).`);
    
//     await Variation.update({ stock_quantity: newStock }, { where: { id: variationId }, transaction });
//     await StockMovement.create({
//       variation_id: variationId,
//       product_id: variation.product_id, 
//       movement_type: movementType,
//       quantity_changed: quantityChanged,
//       remarks: remarks,
//       user_id: userId
//     }, { transaction });

//   } else if (accessoryId) { // <<--- ADDED ACCESSORY STOCK HANDLING ---<<
//     itemType = 'Accessory';
//     itemId = accessoryId;
//     const accessory = await Accessory.findByPk(accessoryId, { transaction });
//     if (!accessory) throw new Error(`Accessory with id=${accessoryId} not found.`);
//     // Assuming Accessory model has 'stock_quantity' field
//     if (accessory.stock_quantity === undefined) throw new Error(`Accessory model (id=${accessoryId}) does not have a 'stock_quantity' field.`);
//     currentItemStock = accessory.stock_quantity;

//     const newStock = accessory.stock_quantity + quantityChanged;
//     if (newStock < 0) throw new Error(`Stock for accessory id=${accessoryId} cannot go below zero (Attempted: ${newStock}, Change: ${quantityChanged}, Old: ${currentItemStock}).`);

//     await Accessory.update({ stock_quantity: newStock }, { where: { id: accessoryId }, transaction });
//     await StockMovement.create({
//       accessory_id: accessoryId,
//       product_id: accessory.product_id, // Log parent product
//       movement_type: movementType,
//       quantity_changed: quantityChanged,
//       remarks: remarks,
//       user_id: userId
//     }, { transaction });
//   // >>----------------------------------------------------<<
//   } else if (productId) { // This should be for 'simple' products only
//     itemType = 'Product';
//     itemId = productId;
//     const product = await Product.findByPk(productId, { transaction });
//     if (!product) throw new Error(`Product with id=${productId} not found.`);
//     if (product.product_type !== 'simple') {
//         throw new Error(`Direct stock adjustments for non-simple product id=${productId} should target its variations/accessories.`);
//     }
//     currentItemStock = product.current_stock;
    
//     const newStock = product.current_stock + quantityChanged;
//     if (newStock < 0) throw new Error(`Stock for product id=${productId} cannot go below zero (Attempted: ${newStock}, Change: ${quantityChanged}, Old: ${currentItemStock}).`);
    
//     await Product.update({ current_stock: newStock }, { where: { id: productId }, transaction });
//     await StockMovement.create({
//       product_id: productId,
//       movement_type: movementType,
//       quantity_changed: quantityChanged,
//       remarks: remarks,
//       user_id: userId
//     }, { transaction });
//   } else {
//     throw new Error("Either productId, variationId, or accessoryId must be provided for stock movement.");
//   }
//   console.log(`Stock updated and movement logged for ${itemType} ID ${itemId}. Type: ${movementType}, QtyChg: ${quantityChanged}, OldStock: ${currentItemStock}, NewStock: ${currentItemStock + quantityChanged}`);
// }

// // Create a Manual Stock Adjustment
// exports.createManualAdjustment = async (req, res) => {
//   const { product_id, variation_id, accessory_id, movement_type, quantity, remarks } = req.body;
//   const userId = req.userId; 

//   if (!movement_type || !['adjustment_in', 'adjustment_out', 'initial_stock', 'damaged', /* add other relevant types if needed */].includes(movement_type)) {
//     return res.status(400).send({ message: "Invalid or missing movement_type." });
//   }
//   if (quantity === undefined || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
//     return res.status(400).send({ message: "Valid positive quantity is required for adjustment." });
//   }
//   if (!product_id && !variation_id && !accessory_id) {
//     return res.status(400).send({ message: "Either product_id, variation_id, or accessory_id is required." });
//   }

//   const quantityChanged = ['adjustment_in', 'initial_stock'].includes(movement_type)
//                           ? Math.abs(parseInt(quantity)) 
//                           : -Math.abs(parseInt(quantity));

//   const t = await db.sequelize.transaction(); 
//   try {
//     await updateStockAndLog(
//         product_id ? parseInt(product_id) : null, 
//         variation_id ? parseInt(variation_id) : null,
//         accessory_id ? parseInt(accessory_id) : null,
//         movement_type, 
//         quantityChanged, 
//         remarks, 
//         userId, 
//         t
//     );
//     await t.commit(); 
//     res.status(201).send({ message: "Stock adjustment created and stock updated successfully." });
//   } catch (err) {
//     await t.rollback(); 
//     console.error("Error in createManualAdjustment:", err.message, err.stack);
//     res.status(500).send({ message: err.message || "Error creating stock adjustment." });
//   }
// };

// // Retrieve all Stock Movements (with filters)
// exports.findAllMovements = async (req, res) => {
//   const { 
//     productId: queryProductId, 
//     variationId: queryVariationId, 
//     accessoryId: queryAccessoryId, 
//     movementType, 
//     userId: queryUserId, 
//     startDate, 
//     endDate 
//   } = req.query;
  
//   let whereClause = {};
  
//   // Foreign key names should match how they are defined in your StockMovement model/associations
//   if (queryProductId) whereClause.productId = queryProductId;     
//   if (queryVariationId) whereClause.variationId = queryVariationId;   
//   if (queryAccessoryId) whereClause.accessoryId = queryAccessoryId;   
//   if (movementType) whereClause.movement_type = { [Op.like]: `%${movementType}%` };
//   if (queryUserId) whereClause.userId = queryUserId;

//   if (startDate && endDate) {
//     whereClause.createdAt = { [Op.between]: [new Date(startDate), new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1))] }; // Ensure endDate includes the whole day
//   } else if (startDate) {
//     whereClause.createdAt = { [Op.gte]: new Date(startDate) };
//   } else if (endDate) {
//     whereClause.createdAt = { [Op.lte]: new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1)) };
//   }
  
//   try {
//     const movements = await StockMovement.findAll({
//       where: whereClause,
//       include: [
//         { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
//         { model: Variation, as: 'variation', attributes: ['id', 'attribute_name', 'attribute_value'] },
//         { model: Accessory, as: 'accessory', attributes: ['id', 'name'] },
//         { model: User, as: 'user', attributes: ['id', 'username'] } // <<--- YEH USER INCLUDE HAI
//       ],
//       order: [['createdAt', 'DESC']]
//     });
//     res.send(movements);
//   } catch (err) { /* ... error handling ... */ }

// //   StockMovement.findAll({
// //     where: whereClause,
// //     include: [
// //       { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
// //       { model: Variation, as: 'variation', attributes: ['id', 'attribute_name', 'attribute_value'] },
// //       { model: Accessory, as: 'accessory', attributes: ['id', 'name'] }, // Include accessory
// //       { model: User, as: 'user', attributes: ['id', 'username'] }
// //     ],
// //     order: [['createdAt', 'DESC']]
// //   })
// //   .then(data => {
// //     res.send(data);
// //   })
// //   .catch(err => {
// //     console.error("Error in findAllMovements:", err);
// //     res.status(500).send({ message: err.message || "Error retrieving stock movements." });
// //   });
// };

// // Find a single Stock Movement with an id
// exports.findOneMovement = (req, res) => {
//   const id = req.params.id;
//   StockMovement.findByPk(id, {
//     include: [
//       { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
//       { model: Variation, as: 'variation', attributes: ['id', 'attribute_name', 'attribute_value'] },
//       { model: Accessory, as: 'accessory', attributes: ['id', 'name'] },
//       { model: User, as: 'user', attributes: ['id', 'username'] }
//     ]
//   })
//   .then(data => {
//     if (data) {
//       res.send(data);
//     } else {
//       res.status(404).send({ message: `Stock Movement with id=${id} not found.` });
//     }
//   })
//   .catch(err => {
//     console.error("Error in findOneMovement:", err);
//     res.status(500).send({ message: "Error retrieving Stock Movement with id=" + id });
//   });
// };