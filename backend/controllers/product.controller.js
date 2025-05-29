// backend/controllers/product.controller.js
const db = require("../models");
const Product = db.product;
const Variation = db.variation;
const Accessory = db.accessory;
const Website = db.website;
const Category = db.category;
const Supplier = db.supplier;
const StockMovement = db.stock_movement; // <<--- ENSURE STOCK_MOVEMENT MODEL IS IMPORTED
const Op = db.Sequelize.Op;

// --- Helper Function to check if associated entities exist ---
async function validateAssociations(reqBody, res) {
  if (reqBody.website_id) {
    const website = await Website.findByPk(reqBody.website_id);
    if (!website) {
      res.status(400).send({ message: `Failed! Website with id=${reqBody.website_id} does not exist.` });
      return false;
    }
  }
  if (reqBody.category_id) {
    const category = await Category.findByPk(reqBody.category_id);
    if (!category) {
      res.status(400).send({ message: `Failed! Category with id=${reqBody.category_id} does not exist.` });
      return false;
    }
  }
  if (reqBody.supplier_id) {
    const supplier = await Supplier.findByPk(reqBody.supplier_id);
    if (!supplier) {
      res.status(400).send({ message: `Failed! Supplier with id=${reqBody.supplier_id} does not exist.` });
      return false;
    }
  }
  return true;
}


// --- Product CRUD ---
exports.createProduct = async (req, res) => {
  const { name, sku, description, product_type, base_price, current_stock, cost_of_goods, website_id, category_id, supplier_id } = req.body;
  const userId = req.userId; // Assuming authJwt middleware sets this

  if (!name || !product_type) {
    return res.status(400).send({ message: "Product name and type are required!" });
  }
  if (!['simple', 'variable', 'customisable'].includes(product_type)) {
    return res.status(400).send({ message: "Invalid product type." });
  }

  const associationsValid = await validateAssociations(req.body, res);
  if (!associationsValid) return; // Error response already sent by helper

  const t = await db.sequelize.transaction(); // Start a transaction

  try {
    if (sku) { // Check SKU uniqueness if provided
        const existingSku = await Product.findOne({ where: { sku: sku }, transaction: t }); // Added transaction
        if (existingSku) {
            await t.rollback();
            return res.status(400).send({ message: "Failed! SKU already exists."});
        }
    }

    const initialStockForSimple = product_type === 'simple' ? (parseInt(current_stock) || 0) : 0; // Set to 0 for non-simple

    const product = await Product.create({
      name,
      sku,
      description,
      product_type,
      base_price: base_price ? parseFloat(base_price) : null, // Ensure float
      current_stock: initialStockForSimple, // Use parsed initial stock
      cost_of_goods: cost_of_goods ? parseFloat(cost_of_goods) : null, // Ensure float
      website_id: website_id || null,
      category_id: category_id || null,
      supplier_id: supplier_id || null,
    }, { transaction: t });

    // Log initial stock for 'simple' products if stock is greater than 0
    if (product_type === 'simple' && initialStockForSimple > 0) {
      await StockMovement.create({
        product_id: product.id,
        movement_type: 'initial_stock',
        quantity_changed: initialStockForSimple,
        remarks: 'Initial stock on product creation',
        user_id: userId 
      }, { transaction: t });
      console.log(`Stock movement logged for simple product ID ${product.id}, initial stock: ${initialStockForSimple}`);
    }

    await t.commit();
    res.status(201).send(product);
  } catch (err) {
    await t.rollback();
    console.error("Error in createProduct:", err);
    res.status(500).send({ message: err.message || "Error creating product." });
  }
};

exports.findAllProducts = (req, res) => {
  Product.findAll({
    include: [
      { model: Website, as: 'website', attributes: ['id', 'name'] },
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
    ],
    order: [['name', 'ASC']]
  })
  .then(data => {
    res.send(data);
  })
  .catch(err => {
    console.error("Error in findAllProducts:", err); // Added console.error
    res.status(500).send({ message: err.message || "Error retrieving products." });
  });
};

exports.findOneProduct = (req, res) => {
  const productId = req.params.productId;
  Product.findByPk(productId, {
    include: [
      { model: Website, as: 'website', attributes: ['id', 'name'] },
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
      { model: Variation, as: 'variations' }, 
      { model: Accessory, as: 'accessories' }
    ]
  })
  .then(product => {
    if (product) {
      res.send(product);
    } else {
      res.status(404).send({ message: `Product with id=${productId} not found.` });
    }
  })
  .catch(err => {
    console.error(`Error in findOneProduct for ID ${productId}:`, err); // Added console.error
    res.status(500).send({ message: `Error retrieving product with id=${productId}: ${err.message}`});
  });
};

exports.updateProduct = async (req, res) => {
  const productId = req.params.productId;
  const userId = req.userId; // from authJwt
  // No need to destructure all, req.body will be used for updateData after validation

  if (Object.keys(req.body).length === 0) {
    return res.status(400).send({ message: "No data provided for update!" });
  }
  if (req.body.product_type && !['simple', 'variable', 'customisable'].includes(req.body.product_type)) {
    return res.status(400).send({ message: "Invalid product type if attempting to change." });
  }
  
  const associationsValid = await validateAssociations(req.body, res);
  if (!associationsValid) return;

  const t = await db.sequelize.transaction();
  try {
    const productToUpdate = await Product.findByPk(productId, { transaction: t });
    if (!productToUpdate) {
      await t.rollback();
      return res.status(404).send({ message: `Product with id=${productId} not found.` });
    }

    // Prepare updateData carefully
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.sku !== undefined) {
        if (req.body.sku !== productToUpdate.sku) { // Check SKU uniqueness only if being changed
            const existingSku = await Product.findOne({ where: { sku: req.body.sku }, transaction: t });
            if (existingSku && existingSku.id !== parseInt(productId)) {
                await t.rollback();
                return res.status(400).send({ message: "Failed! SKU already exists."});
            }
        }
        updateData.sku = req.body.sku;
    }
    if (req.body.description !== undefined) updateData.description = req.body.description;
    // product_type is usually not changed after creation, can add logic to prevent if needed
    if (req.body.product_type !== undefined && req.body.product_type !== productToUpdate.product_type) {
        // If product type changes, existing variations/accessories might become invalid.
        // For now, allowing type change but this needs careful consideration for data integrity.
        console.warn(`Product type changing for ID ${productId} from ${productToUpdate.product_type} to ${req.body.product_type}. Associated variations/accessories might need cleanup.`);
        updateData.product_type = req.body.product_type;
    }
    if (req.body.base_price !== undefined) updateData.base_price = req.body.base_price ? parseFloat(req.body.base_price) : null;
    if (req.body.cost_of_goods !== undefined) updateData.cost_of_goods = req.body.cost_of_goods ? parseFloat(req.body.cost_of_goods) : null;
    if (req.body.website_id !== undefined) updateData.website_id = req.body.website_id || null;
    if (req.body.category_id !== undefined) updateData.category_id = req.body.category_id || null;
    if (req.body.supplier_id !== undefined) updateData.supplier_id = req.body.supplier_id || null;
    
    let stockChange = 0;
    // Stock update logic and logging for 'simple' products ONLY
    if (productToUpdate.product_type === 'simple' && req.body.current_stock !== undefined) {
      const newStock = parseInt(req.body.current_stock);
      if (isNaN(newStock) || newStock < 0) {
        await t.rollback();
        return res.status(400).send({ message: "Invalid stock quantity for simple product." });
      }
      stockChange = newStock - productToUpdate.current_stock;
      updateData.current_stock = newStock; // Add to updateData only if type is simple
    } else if (productToUpdate.product_type !== 'simple' && req.body.current_stock !== undefined) {
      console.warn(`Attempt to update current_stock directly for a non-simple product (ID: ${productId}). This should be managed via variations/POS.`);
      // Do not include current_stock in updateData for non-simple types from this main product update
    }


    if (Object.keys(updateData).length === 0) {
      await t.rollback();
      return res.status(400).send({ message: "No valid data provided for update or data is the same." });
    }

    const [num] = await Product.update(updateData, { where: { id: productId }, transaction: t });

    if (num == 1) {
      if (productToUpdate.product_type === 'simple' && stockChange !== 0) {
        await StockMovement.create({
          product_id: parseInt(productId),
          movement_type: stockChange > 0 ? 'adjustment_in' : 'adjustment_out',
          quantity_changed: stockChange,
          remarks: `Stock manually updated for product by user ${userId}. Old: ${productToUpdate.current_stock}, New: ${req.body.current_stock}`,
          user_id: userId
        }, { transaction: t });
        console.log(`Stock movement logged for simple product ID ${productId}, change: ${stockChange}`);
      }
      await t.commit();
      res.send({ message: "Product was updated successfully." });
    } else {
      await t.rollback();
      res.status(304).send({ 
        message: `Product with id=${productId} was not updated. Maybe product was not found or data was the same.`
      });
    }
  } catch (err) {
    await t.rollback();
    console.error("Error in updateProduct:", err);
    res.status(500).send({ message: `Error updating product with id=${productId}: ${err.message}` });
  }
};

exports.deleteProduct = async (req, res) => {
  const productId = req.params.productId;
  // When a product is deleted, associated variations and accessories will be deleted due to onDelete: 'CASCADE'
  // We should also log stock movements to bring their stock to zero if they had any.
  // This can get complex. For now, we rely on CASCADE.
  // A more robust solution would be to fetch variations/accessories, log their stock out, then delete.
  const t = await db.sequelize.transaction();
  try {
    const product = await Product.findByPk(productId, { transaction: t });
    if(!product){
        await t.rollback();
        return res.status(404).send({ message: `Product with id=${productId} not found!`});
    }
    // If it's a simple product with stock, log its stock out
    if(product.product_type === 'simple' && product.current_stock > 0){
        await StockMovement.create({
            product_id: productId,
            movement_type: 'adjustment_out_del', // Indicate deletion adjustment
            quantity_changed: -product.current_stock,
            remarks: `Stock zeroed out due to product deletion. User ID: ${req.userId || 'System'}`,
            user_id: req.userId || null
        }, {transaction: t});
    }
    // For variable products, variations are cascaded. Their stock movements will remain.
    // To properly zero out variation stock and log it, we'd need to fetch variations first.
    // This simplification relies on CASCADE for variations/accessories deletion.

    const num = await Product.destroy({ where: { id: productId }, transaction: t });
    if (num == 1) {
      await t.commit();
      res.send({ message: "Product and its associated variations/accessories were deleted successfully!" });
    } else {
      // This case should ideally not be reached if findByPk found the product.
      await t.rollback();
      res.status(404).send({ message: `Cannot delete Product with id=${productId}. Maybe it was not found post-check.`});
    }
  } catch (err) {
    await t.rollback();
    console.error("Error in deleteProduct:", err);
    res.status(500).send({ message: `Could not delete Product with id=${productId}: ${err.message}`});
  }
};


// --- Variation Management ---
exports.addVariation = async (req, res) => {
  const productId = req.params.productId;
  const { attribute_name, attribute_value, additional_price, sku_suffix, stock_quantity } = req.body;
  const userId = req.userId;

  if (!attribute_name || !attribute_value || stock_quantity === undefined) {
    return res.status(400).send({ message: "Attribute name, value, and stock quantity are required for variation." });
  }
  const initialStock = parseInt(stock_quantity);
  if (isNaN(initialStock) || initialStock < 0) {
    return res.status(400).send({ message: "Stock quantity must be a non-negative number." });
  }

  const t = await db.sequelize.transaction();
  try {
    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) { await t.rollback(); return res.status(404).send({ message: `Product with id=${productId} not found.` }); }
    if (product.product_type !== 'variable') { await t.rollback(); return res.status(400).send({ message: `Product id=${productId} is not a 'variable' type product. Cannot add variation.` }); }
    
    const existingVariation = await Variation.findOne({
      where: { product_id: parseInt(productId), attribute_name: attribute_name, attribute_value: attribute_value},
      transaction: t
    });
    if (existingVariation) { await t.rollback(); return res.status(400).send({ message: `Variation with attribute '${attribute_name}: ${attribute_value}' already exists for this product.` }); }

    const variation = await Variation.create({
      product_id: parseInt(productId), 
      attribute_name,
      attribute_value,
      additional_price: parseFloat(additional_price) || 0.00,
      sku_suffix: sku_suffix || null,
      stock_quantity: initialStock
    }, { transaction: t });

    if (initialStock > 0) {
      await StockMovement.create({
        variation_id: variation.id,
        product_id: parseInt(productId),
        movement_type: 'initial_stock_var',
        quantity_changed: initialStock,
        remarks: `Initial stock for variation: ${variation.attribute_name} - ${variation.attribute_value}`,
        user_id: userId
      }, { transaction: t });
      console.log(`Stock movement logged for new variation ID ${variation.id}, initial stock: ${initialStock}`);
    }

    await t.commit();
    res.status(201).send(variation);
  } catch (err) {
    await t.rollback();
    console.error("Error in addVariation:", err);
    res.status(500).send({ message: err.message || "Error creating variation." });
  }
};

exports.findAllVariationsForProduct = (req, res) => {
  const productId = req.params.productId;
  Variation.findAll({ where: { product_id: productId }, order: [['attribute_name', 'ASC'],['attribute_value', 'ASC']] })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.error("Error in findAllVariationsForProduct:", err);
      res.status(500).send({ message: err.message || "Error retrieving variations." });
    });
};

exports.updateVariation = async (req, res) => {
  const variationId = req.params.variationId;
  const userId = req.userId;
  const updateDataFromRequest = req.body;

  const t = await db.sequelize.transaction();
  try {
    const variationToUpdate = await Variation.findByPk(variationId, { transaction: t });
    if (!variationToUpdate) {
      await t.rollback();
      return res.status(404).send({ message: `Variation with id=${variationId} not found.` });
    }

    const oldStock = variationToUpdate.stock_quantity;
    
    // Prepare updateData carefully from req.body
    const updateData = {};
    if (updateDataFromRequest.attribute_name !== undefined) updateData.attribute_name = updateDataFromRequest.attribute_name;
    if (updateDataFromRequest.attribute_value !== undefined) updateData.attribute_value = updateDataFromRequest.attribute_value;
    if (updateDataFromRequest.additional_price !== undefined) updateData.additional_price = parseFloat(updateDataFromRequest.additional_price) || 0.00;
    if (updateDataFromRequest.sku_suffix !== undefined) updateData.sku_suffix = updateDataFromRequest.sku_suffix;
    
    let stockChange = 0;
    let newStock = oldStock;

    if (updateDataFromRequest.stock_quantity !== undefined && updateDataFromRequest.stock_quantity !== null) {
      newStock = parseInt(updateDataFromRequest.stock_quantity);
      if (isNaN(newStock) || newStock < 0) {
        await t.rollback();
        return res.status(400).send({ message: "Stock quantity must be a non-negative number." });
      }
      updateData.stock_quantity = newStock;
      stockChange = newStock - oldStock;
    }


    if (Object.keys(updateData).length === 0) {
      await t.rollback();
      return res.status(400).send({ message: "No data provided for update." });
    }
    
    // Optional: Uniqueness check for attribute_name/value if they are changed
    if ((updateData.attribute_name && updateData.attribute_name !== variationToUpdate.attribute_name) || 
        (updateData.attribute_value && updateData.attribute_value !== variationToUpdate.attribute_value)) {
        const checkName = updateData.attribute_name || variationToUpdate.attribute_name;
        const checkValue = updateData.attribute_value || variationToUpdate.attribute_value;
        const existingVariation = await Variation.findOne({
            where: {
                product_id: variationToUpdate.product_id,
                attribute_name: checkName,
                attribute_value: checkValue,
                id: { [Op.ne]: variationId } // Exclude self
            },
            transaction: t
        });
        if (existingVariation) {
            await t.rollback();
            return res.status(400).send({ message: `Another variation with attribute '${checkName}: ${checkValue}' already exists for this product.` });
        }
    }


    const [num] = await Variation.update(updateData, { where: { id: variationId }, transaction: t });

    if (num == 1) {
      if (stockChange !== 0) {
        await StockMovement.create({
          variation_id: parseInt(variationId),
          product_id: variationToUpdate.product_id,
          movement_type: stockChange > 0 ? 'adjustment_in_var' : 'adjustment_out_var',
          quantity_changed: stockChange,
          remarks: `Stock updated for variation by user ${userId}. Old: ${oldStock}, New: ${newStock}`,
          user_id: userId
        }, { transaction: t });
        console.log(`Stock movement logged for variation ID ${variationId}, change: ${stockChange}`);
      }
      await t.commit();
      const updatedVariation = await Variation.findByPk(variationId); 
      res.send({ message: "Variation was updated successfully.", variation: updatedVariation });
    } else {
      await t.rollback();
      res.status(304).send({ message: `Variation with id=${variationId} not updated. Data might be same or not found.`});
    }
  } catch (err) {
    await t.rollback();
    console.error("Error in updateVariation:", err);
    res.status(500).send({ message: `Error updating Variation: ${err.message}`});
  }
};

exports.deleteVariation = async (req, res) => {
  const variationId = req.params.variationId;
  const userId = req.userId;
  const t = await db.sequelize.transaction();
  try {
    const variationToDelete = await Variation.findByPk(variationId, {transaction: t});
    if(!variationToDelete){
        await t.rollback();
        return res.status(404).send({ message: `Variation with id=${variationId} not found!`});
    }

    // Log stock out before deleting variation if it has stock
    if (variationToDelete.stock_quantity > 0) {
        await StockMovement.create({
            variation_id: variationId,
            product_id: variationToDelete.product_id,
            movement_type: 'adjustment_out_del_var',
            quantity_changed: -variationToDelete.stock_quantity,
            remarks: `Stock zeroed out due to variation deletion. User ID: ${userId}`,
            user_id: userId
        }, {transaction: t});
        console.log(`Stock movement logged for deleted variation ID ${variationId}, stock zeroed: ${variationToDelete.stock_quantity}`);
    }

    const num = await Variation.destroy({ where: { id: variationId }, transaction: t });
    if (num == 1) {
      await t.commit();
      res.send({ message: "Variation was deleted successfully!" });
    } else {
      // Should not happen if findByPk found it
      await t.rollback();
      res.status(404).send({ message: `Cannot delete Variation with id=${variationId}. Maybe not found post-check.`});
    }
  } catch (err) {
    await t.rollback();
    console.error("Error in deleteVariation:", err);
    res.status(500).send({ message: `Could not delete Variation with id=${variationId}: ${err.message}`});
  }
};


// --- Accessory Management (Updated with Stock Logging) ---
exports.addAccessory = async (req, res) => {
  const productId = req.params.productId;
  const { name, description, price, stock_quantity, stock_impact } = req.body;
  const userId = req.userId;

  if (!name || price === undefined || stock_quantity === undefined) { // Assuming stock_quantity is now mandatory
    return res.status(400).send({ message: "Accessory name, price, and stock quantity are required." });
  }
  const initialStock = parseInt(stock_quantity);
  if (isNaN(initialStock) || initialStock < 0) {
    return res.status(400).send({ message: "Accessory stock quantity must be a non-negative number." });
  }
   if (parseFloat(price) < 0) {
      return res.status(400).send({ message: "Accessory price cannot be negative." });
  }

  const t = await db.sequelize.transaction();
  try {
    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) { await t.rollback(); return res.status(404).send({ message: `Product with id=${productId} not found.` }); }
    if (product.product_type !== 'customisable') { await t.rollback(); return res.status(400).send({ message: `Product id=${productId} is not 'customisable'.` }); }
    
    const existingAccessory = await Accessory.findOne({ where: { product_id: parseInt(productId), name: name }, transaction: t });
    if (existingAccessory) { await t.rollback(); return res.status(400).send({ message: `Accessory with name '${name}' already exists.`}); }

    const accessory = await Accessory.create({
      product_id: parseInt(productId), name, description,
      price: parseFloat(price) || 0.00,
      stock_quantity: initialStock, // Using stock_quantity
      stock_impact: parseInt(stock_impact) || 0 
    }, { transaction: t });

    if (initialStock > 0) {
      await StockMovement.create({
        accessory_id: accessory.id,
        product_id: parseInt(productId),
        movement_type: 'initial_stock_acc',
        quantity_changed: initialStock,
        remarks: `Initial stock for accessory: ${name}`,
        user_id: userId
      }, { transaction: t });
      console.log(`Stock movement logged for new accessory ID ${accessory.id}, stock: ${initialStock}`);
    }

    await t.commit();
    res.status(201).send(accessory);
  } catch (err) {
    await t.rollback();
    console.error("Error in addAccessory:", err);
    res.status(500).send({ message: err.message || "Error creating accessory." });
  }
};

exports.findAllAccessoriesForProduct = (req, res) => {
  const productId = req.params.productId;
  Accessory.findAll({ where: { product_id: productId }, order: [['name', 'ASC']] })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.error("Error in findAllAccessoriesForProduct:", err);
      res.status(500).send({ message: err.message || "Error retrieving accessories." });
    });
};

exports.updateAccessory = async (req, res) => {
  const accessoryId = req.params.accessoryId;
  const userId = req.userId;
  const updateDataFromRequest = req.body;

  const t = await db.sequelize.transaction();
  try {
    const accessoryToUpdate = await Accessory.findByPk(accessoryId, { transaction: t });
    if (!accessoryToUpdate) { await t.rollback(); return res.status(404).send({ message: `Accessory with id=${accessoryId} not found.` });}

    const oldStock = accessoryToUpdate.stock_quantity;
    const updateData = {};
    if (updateDataFromRequest.name !== undefined) updateData.name = updateDataFromRequest.name;
    if (updateDataFromRequest.description !== undefined) updateData.description = updateDataFromRequest.description;
    if (updateDataFromRequest.price !== undefined) { /* ... price validation ... */ updateData.price = parseFloat(updateDataFromRequest.price) || 0.00; }
    if (updateDataFromRequest.stock_impact !== undefined) updateData.stock_impact = parseInt(updateDataFromRequest.stock_impact) || 0;
    
    let stockChange = 0;
    let newStock = oldStock;
    if (updateDataFromRequest.stock_quantity !== undefined && updateDataFromRequest.stock_quantity !== null) {
      newStock = parseInt(updateDataFromRequest.stock_quantity);
      if (isNaN(newStock) || newStock < 0) { await t.rollback(); return res.status(400).send({ message: "Accessory stock must be non-negative." });}
      updateData.stock_quantity = newStock;
      stockChange = newStock - oldStock;
    } else {
      delete updateData.stock_quantity;
    }

    if (Object.keys(updateData).length === 0) { await t.rollback(); return res.status(400).send({ message: "No data for update." });}
    
    // Optional: Uniqueness check for name if changed
    if (updateData.name && updateData.name !== accessoryToUpdate.name) { /* ... uniqueness check ... */ }

    const [num] = await Accessory.update(updateData, { where: { id: accessoryId }, transaction: t });
    if (num == 1) {
      if (stockChange !== 0) {
        await StockMovement.create({
          accessory_id: parseInt(accessoryId), product_id: accessoryToUpdate.product_id,
          movement_type: stockChange > 0 ? 'adjustment_in_acc' : 'adjustment_out_acc',
          quantity_changed: stockChange,
          remarks: `Stock updated for accessory by user ${userId}. Old: ${oldStock}, New: ${newStock}`,
          user_id: userId
        }, { transaction: t });
        console.log(`Stock movement logged for accessory ID ${accessoryId}, change: ${stockChange}`);
      }
      await t.commit();
      const updatedAccessory = await Accessory.findByPk(accessoryId);
      res.send({ message: "Accessory updated.", accessory: updatedAccessory });
    } else { await t.rollback(); res.status(304).send({ message: `Accessory not updated.`}); }
  } catch (err) { await t.rollback(); console.error("Error in updateAccessory:", err); res.status(500).send({ message: `Error updating Accessory: ${err.message}`}); }
};

exports.deleteAccessory = async (req, res) => {
  const accessoryId = req.params.accessoryId;
  const userId = req.userId;
  const t = await db.sequelize.transaction();
  try {
    const accessoryToDelete = await Accessory.findByPk(accessoryId, {transaction: t});
    if(!accessoryToDelete){ await t.rollback(); return res.status(404).send({ message: `Accessory with id=${accessoryId} not found!`}); }

    if (accessoryToDelete.stock_quantity > 0) {
        await StockMovement.create({
            accessory_id: accessoryId, product_id: accessoryToDelete.product_id,
            movement_type: 'adjustment_out_del_acc',
            quantity_changed: -accessoryToDelete.stock_quantity,
            remarks: `Stock zeroed due to accessory deletion. User ID: ${userId}`,
            user_id: userId
        }, {transaction: t});
        console.log(`Stock movement logged for deleted accessory ID ${accessoryId}, stock zeroed: ${accessoryToDelete.stock_quantity}`);
    }
    const num = await Accessory.destroy({ where: { id: accessoryId }, transaction: t });
    if (num == 1) { await t.commit(); res.send({ message: "Accessory was deleted successfully!" });
    } else { await t.rollback(); res.status(404).send({ message: `Cannot delete Accessory.`}); }
  } catch (err) { await t.rollback(); console.error("Error in deleteAccessory:", err); res.status(500).send({ message: `Could not delete Accessory: ${err.message}`}); }
};





// // backend/controllers/product.controller.js
// const db = require("../models");
// const Product = db.product;
// const Variation = db.variation;
// const Accessory = db.accessory;
// const Website = db.website;
// const Category = db.category;
// const Supplier = db.supplier;
// const Op = db.Sequelize.Op; // For search/filter operations later

// // --- Helper Function to check if associated entities exist ---
// async function validateAssociations(reqBody, res) {
//   if (reqBody.website_id) {
//     const website = await Website.findByPk(reqBody.website_id);
//     if (!website) {
//       res.status(400).send({ message: `Failed! Website with id=${reqBody.website_id} does not exist.` });
//       return false;
//     }
//   }
//   if (reqBody.category_id) {
//     const category = await Category.findByPk(reqBody.category_id);
//     if (!category) {
//       res.status(400).send({ message: `Failed! Category with id=${reqBody.category_id} does not exist.` });
//       return false;
//     }
//   }
//   if (reqBody.supplier_id) {
//     const supplier = await Supplier.findByPk(reqBody.supplier_id);
//     if (!supplier) {
//       res.status(400).send({ message: `Failed! Supplier with id=${reqBody.supplier_id} does not exist.` });
//       return false;
//     }
//   }
//   return true;
// }


// // --- Product CRUD ---
// exports.createProduct = async (req, res) => {
//   const { name, sku, description, product_type, base_price, current_stock, cost_of_goods, website_id, category_id, supplier_id } = req.body;

//   if (!name || !product_type) {
//     return res.status(400).send({ message: "Product name and type are required!" });
//   }
//   if (!['simple', 'variable', 'customisable'].includes(product_type)) {
//       return res.status(400).send({ message: "Invalid product type." });
//   }

//   // Validate associations
//   const associationsValid = await validateAssociations(req.body, res);
//   if (!associationsValid) return; // Error response already sent by helper

//   try {
//     if (sku) { // Check SKU uniqueness if provided
//         const existingSku = await Product.findOne({ where: { sku: sku }});
//         if (existingSku) {
//             return res.status(400).send({ message: "Failed! SKU already exists."});
//         }
//     }

//     const product = await Product.create({
//       name,
//       sku,
//       description,
//       product_type,
//       base_price: base_price || null,
//       current_stock: product_type === 'simple' ? (current_stock || 0) : null, // Stock for simple products
//       cost_of_goods: cost_of_goods || null,
//       website_id: website_id || null,
//       category_id: category_id || null,
//       supplier_id: supplier_id || null,
//     });
//     res.status(201).send(product);
//   } catch (err) {
//     res.status(500).send({ message: err.message || "Error creating product." });
//   }
// };

// exports.findAllProducts = (req, res) => {
//   // TODO: Add filters (name, sku, type, website, category, supplier), pagination
//   Product.findAll({
//     include: [
//       { model: Website, as: 'website', attributes: ['id', 'name'] },
//       { model: Category, as: 'category', attributes: ['id', 'name'] },
//       { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
//       // Include variations and accessories here if needed in the list view directly
//       // This can make the payload large, usually fetched when viewing a single product
//       // { model: Variation, as: 'variations' },
//       // { model: Accessory, as: 'accessories' }
//     ],
//     order: [['name', 'ASC']] // Example ordering
//   })
//   .then(data => {
//     res.send(data);
//   })
//   .catch(err => {
//     res.status(500).send({ message: err.message || "Error retrieving products." });
//   });
// };

// exports.findOneProduct = (req, res) => {
//   const productId = req.params.productId;
//   Product.findByPk(productId, {
//     include: [
//       { model: Website, as: 'website', attributes: ['id', 'name'] },
//       { model: Category, as: 'category', attributes: ['id', 'name'] },
//       { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
//       { model: Variation, as: 'variations' }, // Include variations
//       { model: Accessory, as: 'accessories' }  // Include accessories
//     ]
//   })
//   .then(product => {
//     if (product) {
//       res.send(product);
//     } else {
//       res.status(404).send({ message: `Product with id=${productId} not found.` });
//     }
//   })
//   .catch(err => {
//     res.status(500).send({ message: `Error retrieving product with id=${productId}: ${err.message}`});
//   });
// };

// exports.updateProduct = async (req, res) => {
//   const productId = req.params.productId;
//   const { name, sku, description, product_type, base_price, current_stock, cost_of_goods, website_id, category_id, supplier_id } = req.body;

//   if (!name && !product_type && !sku && !description && base_price === undefined && current_stock === undefined && cost_of_goods === undefined && website_id === undefined && category_id === undefined && supplier_id === undefined) {
//     return res.status(400).send({ message: "No data provided for update!" });
//   }
//   if (product_type && !['simple', 'variable', 'customisable'].includes(product_type)) {
//       return res.status(400).send({ message: "Invalid product type." });
//   }
  
//   // Validate associations if they are being updated
//   const associationsValid = await validateAssociations(req.body, res);
//   if (!associationsValid) return;

//   try {
//     const productToUpdate = await Product.findByPk(productId);
//     if (!productToUpdate) {
//         return res.status(404).send({ message: `Product with id=${productId} not found.` });
//     }

//     if (sku && sku !== productToUpdate.sku) { // Check SKU uniqueness if being changed
//         const existingSku = await Product.findOne({ where: { sku: sku }});
//         if (existingSku && existingSku.id !== parseInt(productId)) {
//             return res.status(400).send({ message: "Failed! SKU already exists."});
//         }
//     }
    
//     // For 'simple' products, current_stock can be updated.
//     // For 'variable' or 'customisable', main product's current_stock might be derived or not directly updatable here.
//     // This logic can be refined based on how you want to manage aggregate stock.
//     let stockToUpdate = current_stock;
//     if (productToUpdate.product_type !== 'simple' && current_stock !== undefined) {
//         // For variable/customisable, direct update of product.current_stock might be disabled
//         // or it could mean updating the sum (more complex). Let's allow it for now for simplicity.
//         console.warn(`Warning: Updating current_stock for a ${productToUpdate.product_type} product. Ensure this is intended.`);
//     }


//     const [num] = await Product.update(req.body, { // req.body should contain only fields to update
//       where: { id: productId }
//     });

//     if (num == 1) {
//       res.send({ message: "Product was updated successfully." });
//     } else {
//       res.status(304).send({ // 304 Not Modified or 404 if not found (already checked)
//         message: `Product with id=${productId} was not updated. Maybe product was not found or data was the same.`
//       });
//     }
//   } catch (err) {
//     res.status(500).send({ message: `Error updating product with id=${productId}: ${err.message}` });
//   }
// };

// exports.deleteProduct = async (req, res) => {
//   const productId = req.params.productId;
//   try {
//     // onDelete: 'CASCADE' for variations and accessories in models/index.js will handle deleting them.
//     const num = await Product.destroy({ where: { id: productId }});
//     if (num == 1) {
//       res.send({ message: "Product and its associated variations/accessories were deleted successfully!" });
//     } else {
//       res.status(404).send({ message: `Cannot delete Product with id=${productId}. Maybe it was not found!`});
//     }
//   } catch (err) {
//     res.status(500).send({ message: `Could not delete Product with id=${productId}: ${err.message}`});
//   }
// };

// // --- Variation Management ---
// exports.addVariation = async (req, res) => {
//   const productId = req.params.productId;
//   const { attribute_name, attribute_value, additional_price, sku_suffix, stock_quantity } = req.body;

//   if (!attribute_name || !attribute_value || stock_quantity === undefined) {
//     return res.status(400).send({ message: "Attribute name, value, and stock quantity are required for variation." });
//   }
//   if (stock_quantity < 0) {
//     return res.status(400).send({ message: "Stock quantity cannot be negative." });
//   }

//   try {
//     const product = await Product.findByPk(productId);
//     if (!product) {
//       return res.status(404).send({ message: `Product with id=${productId} not found.` });
//     }
//     if (product.product_type !== 'variable') {
//       return res.status(400).send({ message: `Product id=${productId} is not a 'variable' type product. Cannot add variation.` });
//     }

//     // Optional: Check if a variation with the same attribute_name and attribute_value already exists for this product
//     const existingVariation = await Variation.findOne({
//       where: {
//         product_id: productId,
//         attribute_name: attribute_name,
//         attribute_value: attribute_value
//       }
//     });
//     if (existingVariation) {
//         return res.status(400).send({ message: `Variation with attribute '${attribute_name}: ${attribute_value}' already exists for this product.` });
//     }

//     const variation = await Variation.create({
//       product_id: parseInt(productId), // Ensure productId is an integer
//       attribute_name,
//       attribute_value,
//       additional_price: parseFloat(additional_price) || 0.00,
//       sku_suffix: sku_suffix || null,
//       stock_quantity: parseInt(stock_quantity) || 0
//     });
//     res.status(201).send(variation);
//   } catch (err) {
//     console.error("Error in addVariation:", err);
//     res.status(500).send({ message: err.message || "Error creating variation." });
//   }
// };

// exports.findAllVariationsForProduct = (req, res) => {
//   const productId = req.params.productId;
//   Variation.findAll({ where: { product_id: productId }, order: [['attribute_name', 'ASC'],['attribute_value', 'ASC']] })
//     .then(data => {
//       res.send(data);
//     })
//     .catch(err => {
//       console.error("Error in findAllVariationsForProduct:", err);
//       res.status(500).send({ message: err.message || "Error retrieving variations." });
//     });
// };

// exports.updateVariation = async (req, res) => {
//   const variationId = req.params.variationId;
//   const { attribute_name, attribute_value, additional_price, sku_suffix, stock_quantity } = req.body;

//   // Basic validation for what can be updated
//   const updateData = {};
//   if (attribute_name) updateData.attribute_name = attribute_name;
//   if (attribute_value) updateData.attribute_value = attribute_value;
//   if (additional_price !== undefined) updateData.additional_price = parseFloat(additional_price) || 0.00;
//   if (sku_suffix !== undefined) updateData.sku_suffix = sku_suffix; // Allow setting to null or empty
//   if (stock_quantity !== undefined) {
//     const stock = parseInt(stock_quantity);
//     if (stock < 0) return res.status(400).send({ message: "Stock quantity cannot be negative."});
//     updateData.stock_quantity = stock;
//   }
  
//   if (Object.keys(updateData).length === 0) {
//     return res.status(400).send({ message: "No data provided for update." });
//   }

//   try {
//     // Optional: If attribute_name/value are changed, check for uniqueness again for that product
//     // This can be complex if only one part changes. For now, assuming direct update.

//     const [num] = await Variation.update(updateData, { where: { id: variationId }});
//     if (num == 1) {
//       const updatedVariation = await Variation.findByPk(variationId);
//       res.send({ message: "Variation was updated successfully.", variation: updatedVariation });
//     } else {
//       res.status(404).send({ message: `Cannot update Variation with id=${variationId}. Maybe not found or data was same.`});
//     }
//   } catch (err) {
//     console.error("Error in updateVariation:", err);
//     res.status(500).send({ message: `Error updating Variation with id=${variationId}: ${err.message}`});
//   }
// };

// exports.deleteVariation = async (req, res) => {
//   const variationId = req.params.variationId;
//   try {
//     const num = await Variation.destroy({ where: { id: variationId }});
//     if (num == 1) {
//       res.send({ message: "Variation was deleted successfully!" });
//     } else {
//       res.status(404).send({ message: `Cannot delete Variation with id=${variationId}. Maybe not found!`});
//     }
//   } catch (err) {
//     console.error("Error in deleteVariation:", err);
//     res.status(500).send({ message: `Could not delete Variation with id=${variationId}: ${err.message}`});
//   }
// };


// // --- Accessory Management (Simplified MVP) ---
// exports.addAccessory = async (req, res) => {
//   const productId = req.params.productId;
//   const { name, description, price, stock_impact } = req.body;

//   if (!name || price === undefined) {
//     return res.status(400).send({ message: "Accessory name and price are required." });
//   }
//   if (parseFloat(price) < 0) {
//       return res.status(400).send({ message: "Price cannot be negative." });
//   }

//   try {
//     const product = await Product.findByPk(productId);
//     if (!product) {
//       return res.status(404).send({ message: `Product with id=${productId} not found.` });
//     }
//     if (product.product_type !== 'customisable') {
//       return res.status(400).send({ message: `Product id=${productId} is not a 'customisable' type product. Cannot add accessory.` });
//     }

//     // Optional: Check if an accessory with the same name already exists for this product
//     const existingAccessory = await Accessory.findOne({
//         where: { product_id: productId, name: name }
//     });
//     if (existingAccessory) {
//         return res.status(400).send({ message: `Accessory with name '${name}' already exists for this product.`});
//     }

//     const accessory = await Accessory.create({
//       product_id: parseInt(productId),
//       name,
//       description,
//       price: parseFloat(price) || 0.00,
//       stock_impact: parseInt(stock_impact) || 0
//     });
//     res.status(201).send(accessory);
//   } catch (err) {
//     console.error("Error in addAccessory:", err);
//     res.status(500).send({ message: err.message || "Error creating accessory." });
//   }
// };

// exports.findAllAccessoriesForProduct = (req, res) => {
//   const productId = req.params.productId;
//   Accessory.findAll({ where: { product_id: productId }, order: [['name', 'ASC']] })
//     .then(data => {
//       res.send(data);
//     })
//     .catch(err => {
//       console.error("Error in findAllAccessoriesForProduct:", err);
//       res.status(500).send({ message: err.message || "Error retrieving accessories." });
//     });
// };

// exports.updateAccessory = async (req, res) => {
//   const accessoryId = req.params.accessoryId;
//   const { name, description, price, stock_impact } = req.body;
  
//   const updateData = {};
//   if (name) updateData.name = name;
//   if (description !== undefined) updateData.description = description; // Allow empty string
//   if (price !== undefined) {
//     const accessoryPrice = parseFloat(price);
//     if (accessoryPrice < 0) return res.status(400).send({ message: "Price cannot be negative." });
//     updateData.price = accessoryPrice;
//   }
//   if (stock_impact !== undefined) updateData.stock_impact = parseInt(stock_impact) || 0;

//   if (Object.keys(updateData).length === 0) {
//     return res.status(400).send({ message: "No data provided for update." });
//   }

//   try {
//     // Optional: If name is changed, check for uniqueness for that product
//     const [num] = await Accessory.update(updateData, { where: { id: accessoryId }});
//     if (num == 1) {
//       const updatedAccessory = await Accessory.findByPk(accessoryId);
//       res.send({ message: "Accessory was updated successfully.", accessory: updatedAccessory });
//     } else {
//       res.status(404).send({ message: `Cannot update Accessory with id=${accessoryId}. Maybe not found or data was same.`});
//     }
//   } catch (err) {
//     console.error("Error in updateAccessory:", err);
//     res.status(500).send({ message: `Error updating Accessory with id=${accessoryId}: ${err.message}`});
//   }
// };

// exports.deleteAccessory = async (req, res) => {
//   const accessoryId = req.params.accessoryId;
//   try {
//     const num = await Accessory.destroy({ where: { id: accessoryId }});
//     if (num == 1) {
//       res.send({ message: "Accessory was deleted successfully!" });
//     } else {
//       res.status(404).send({ message: `Cannot delete Accessory with id=${accessoryId}. Maybe not found!`});
//     }
//   } catch (err) {
//     console.error("Error in deleteAccessory:", err);
//     res.status(500).send({ message: `Could not delete Accessory with id=${accessoryId}: ${err.message}`});
//   }
// };