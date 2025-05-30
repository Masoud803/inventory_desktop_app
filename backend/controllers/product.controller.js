// backend/controllers/product.controller.js
const db = require("../models");
const Product = db.product;
const Variation = db.variation;
const Accessory = db.accessory;
const Website = db.website;
const Category = db.category;
const Supplier = db.supplier;
const Op = db.Sequelize.Op; // For search/filter operations later

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

  if (!name || !product_type) {
    return res.status(400).send({ message: "Product name and type are required!" });
  }
  if (!['simple', 'variable', 'customisable'].includes(product_type)) {
      return res.status(400).send({ message: "Invalid product type." });
  }

  // Validate associations
  const associationsValid = await validateAssociations(req.body, res);
  if (!associationsValid) return; // Error response already sent by helper

  try {
    if (sku) { // Check SKU uniqueness if provided
        const existingSku = await Product.findOne({ where: { sku: sku }});
        if (existingSku) {
            return res.status(400).send({ message: "Failed! SKU already exists."});
        }
    }

    const product = await Product.create({
      name,
      sku,
      description,
      product_type,
      base_price: base_price || null,
      current_stock: product_type === 'simple' ? (current_stock || 0) : null, // Stock for simple products
      cost_of_goods: cost_of_goods || null,
      website_id: website_id || null,
      category_id: category_id || null,
      supplier_id: supplier_id || null,
    });
    res.status(201).send(product);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error creating product." });
  }
};

exports.findAllProducts = (req, res) => {
  // TODO: Add filters (name, sku, type, website, category, supplier), pagination
  Product.findAll({
    include: [
      { model: Website, as: 'website', attributes: ['id', 'name'] },
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
      // Include variations and accessories here if needed in the list view directly
      // This can make the payload large, usually fetched when viewing a single product
      // { model: Variation, as: 'variations' },
      // { model: Accessory, as: 'accessories' }
    ],
    order: [['name', 'ASC']] // Example ordering
  })
  .then(data => {
    res.send(data);
  })
  .catch(err => {
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
      { model: Variation, as: 'variations' }, // Include variations
      { model: Accessory, as: 'accessories' }  // Include accessories
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
    res.status(500).send({ message: `Error retrieving product with id=${productId}: ${err.message}`});
  });
};

exports.updateProduct = async (req, res) => {
  const productId = req.params.productId;
  const { name, sku, description, product_type, base_price, current_stock, cost_of_goods, website_id, category_id, supplier_id } = req.body;

  if (!name && !product_type && !sku && !description && base_price === undefined && current_stock === undefined && cost_of_goods === undefined && website_id === undefined && category_id === undefined && supplier_id === undefined) {
    return res.status(400).send({ message: "No data provided for update!" });
  }
  if (product_type && !['simple', 'variable', 'customisable'].includes(product_type)) {
      return res.status(400).send({ message: "Invalid product type." });
  }
  
  // Validate associations if they are being updated
  const associationsValid = await validateAssociations(req.body, res);
  if (!associationsValid) return;

  try {
    const productToUpdate = await Product.findByPk(productId);
    if (!productToUpdate) {
        return res.status(404).send({ message: `Product with id=${productId} not found.` });
    }

    if (sku && sku !== productToUpdate.sku) { // Check SKU uniqueness if being changed
        const existingSku = await Product.findOne({ where: { sku: sku }});
        if (existingSku && existingSku.id !== parseInt(productId)) {
            return res.status(400).send({ message: "Failed! SKU already exists."});
        }
    }
    
    // For 'simple' products, current_stock can be updated.
    // For 'variable' or 'customisable', main product's current_stock might be derived or not directly updatable here.
    // This logic can be refined based on how you want to manage aggregate stock.
    let stockToUpdate = current_stock;
    if (productToUpdate.product_type !== 'simple' && current_stock !== undefined) {
        // For variable/customisable, direct update of product.current_stock might be disabled
        // or it could mean updating the sum (more complex). Let's allow it for now for simplicity.
        console.warn(`Warning: Updating current_stock for a ${productToUpdate.product_type} product. Ensure this is intended.`);
    }


    const [num] = await Product.update(req.body, { // req.body should contain only fields to update
      where: { id: productId }
    });

    if (num == 1) {
      res.send({ message: "Product was updated successfully." });
    } else {
      res.status(304).send({ // 304 Not Modified or 404 if not found (already checked)
        message: `Product with id=${productId} was not updated. Maybe product was not found or data was the same.`
      });
    }
  } catch (err) {
    res.status(500).send({ message: `Error updating product with id=${productId}: ${err.message}` });
  }
};

exports.deleteProduct = async (req, res) => {
  const productId = req.params.productId;
  try {
    // onDelete: 'CASCADE' for variations and accessories in models/index.js will handle deleting them.
    const num = await Product.destroy({ where: { id: productId }});
    if (num == 1) {
      res.send({ message: "Product and its associated variations/accessories were deleted successfully!" });
    } else {
      res.status(404).send({ message: `Cannot delete Product with id=${productId}. Maybe it was not found!`});
    }
  } catch (err) {
    res.status(500).send({ message: `Could not delete Product with id=${productId}: ${err.message}`});
  }
};

// --- Variation Management ---
exports.addVariation = async (req, res) => {
  const productId = req.params.productId;
  const { attribute_name, attribute_value, additional_price, sku_suffix, stock_quantity } = req.body;

  if (!attribute_name || !attribute_value || stock_quantity === undefined) {
    return res.status(400).send({ message: "Attribute name, value, and stock quantity are required for variation." });
  }
  if (stock_quantity < 0) {
    return res.status(400).send({ message: "Stock quantity cannot be negative." });
  }

  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).send({ message: `Product with id=${productId} not found.` });
    }
    if (product.product_type !== 'variable') {
      return res.status(400).send({ message: `Product id=${productId} is not a 'variable' type product. Cannot add variation.` });
    }

    // Optional: Check if a variation with the same attribute_name and attribute_value already exists for this product
    const existingVariation = await Variation.findOne({
      where: {
        product_id: productId,
        attribute_name: attribute_name,
        attribute_value: attribute_value
      }
    });
    if (existingVariation) {
        return res.status(400).send({ message: `Variation with attribute '${attribute_name}: ${attribute_value}' already exists for this product.` });
    }

    const variation = await Variation.create({
      product_id: parseInt(productId), // Ensure productId is an integer
      attribute_name,
      attribute_value,
      additional_price: parseFloat(additional_price) || 0.00,
      sku_suffix: sku_suffix || null,
      stock_quantity: parseInt(stock_quantity) || 0
    });
    res.status(201).send(variation);
  } catch (err) {
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
  const { attribute_name, attribute_value, additional_price, sku_suffix, stock_quantity } = req.body;

  // Basic validation for what can be updated
  const updateData = {};
  if (attribute_name) updateData.attribute_name = attribute_name;
  if (attribute_value) updateData.attribute_value = attribute_value;
  if (additional_price !== undefined) updateData.additional_price = parseFloat(additional_price) || 0.00;
  if (sku_suffix !== undefined) updateData.sku_suffix = sku_suffix; // Allow setting to null or empty
  if (stock_quantity !== undefined) {
    const stock = parseInt(stock_quantity);
    if (stock < 0) return res.status(400).send({ message: "Stock quantity cannot be negative."});
    updateData.stock_quantity = stock;
  }
  
  if (Object.keys(updateData).length === 0) {
    return res.status(400).send({ message: "No data provided for update." });
  }

  try {
    // Optional: If attribute_name/value are changed, check for uniqueness again for that product
    // This can be complex if only one part changes. For now, assuming direct update.

    const [num] = await Variation.update(updateData, { where: { id: variationId }});
    if (num == 1) {
      const updatedVariation = await Variation.findByPk(variationId);
      res.send({ message: "Variation was updated successfully.", variation: updatedVariation });
    } else {
      res.status(404).send({ message: `Cannot update Variation with id=${variationId}. Maybe not found or data was same.`});
    }
  } catch (err) {
    console.error("Error in updateVariation:", err);
    res.status(500).send({ message: `Error updating Variation with id=${variationId}: ${err.message}`});
  }
};

exports.deleteVariation = async (req, res) => {
  const variationId = req.params.variationId;
  try {
    const num = await Variation.destroy({ where: { id: variationId }});
    if (num == 1) {
      res.send({ message: "Variation was deleted successfully!" });
    } else {
      res.status(404).send({ message: `Cannot delete Variation with id=${variationId}. Maybe not found!`});
    }
  } catch (err) {
    console.error("Error in deleteVariation:", err);
    res.status(500).send({ message: `Could not delete Variation with id=${variationId}: ${err.message}`});
  }
};


// --- Accessory Management (Simplified MVP) ---
exports.addAccessory = async (req, res) => {
  const productId = req.params.productId;
  const { name, description, price, stock_impact } = req.body;

  if (!name || price === undefined) {
    return res.status(400).send({ message: "Accessory name and price are required." });
  }
  if (parseFloat(price) < 0) {
      return res.status(400).send({ message: "Price cannot be negative." });
  }

  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).send({ message: `Product with id=${productId} not found.` });
    }
    if (product.product_type !== 'customisable') {
      return res.status(400).send({ message: `Product id=${productId} is not a 'customisable' type product. Cannot add accessory.` });
    }

    // Optional: Check if an accessory with the same name already exists for this product
    const existingAccessory = await Accessory.findOne({
        where: { product_id: productId, name: name }
    });
    if (existingAccessory) {
        return res.status(400).send({ message: `Accessory with name '${name}' already exists for this product.`});
    }

    const accessory = await Accessory.create({
      product_id: parseInt(productId),
      name,
      description,
      price: parseFloat(price) || 0.00,
      stock_impact: parseInt(stock_impact) || 0
    });
    res.status(201).send(accessory);
  } catch (err) {
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
  const { name, description, price, stock_impact } = req.body;
  
  const updateData = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description; // Allow empty string
  if (price !== undefined) {
    const accessoryPrice = parseFloat(price);
    if (accessoryPrice < 0) return res.status(400).send({ message: "Price cannot be negative." });
    updateData.price = accessoryPrice;
  }
  if (stock_impact !== undefined) updateData.stock_impact = parseInt(stock_impact) || 0;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).send({ message: "No data provided for update." });
  }

  try {
    // Optional: If name is changed, check for uniqueness for that product
    const [num] = await Accessory.update(updateData, { where: { id: accessoryId }});
    if (num == 1) {
      const updatedAccessory = await Accessory.findByPk(accessoryId);
      res.send({ message: "Accessory was updated successfully.", accessory: updatedAccessory });
    } else {
      res.status(404).send({ message: `Cannot update Accessory with id=${accessoryId}. Maybe not found or data was same.`});
    }
  } catch (err) {
    console.error("Error in updateAccessory:", err);
    res.status(500).send({ message: `Error updating Accessory with id=${accessoryId}: ${err.message}`});
  }
};

exports.deleteAccessory = async (req, res) => {
  const accessoryId = req.params.accessoryId;
  try {
    const num = await Accessory.destroy({ where: { id: accessoryId }});
    if (num == 1) {
      res.send({ message: "Accessory was deleted successfully!" });
    } else {
      res.status(404).send({ message: `Cannot delete Accessory with id=${accessoryId}. Maybe not found!`});
    }
  } catch (err) {
    console.error("Error in deleteAccessory:", err);
    res.status(500).send({ message: `Could not delete Accessory with id=${accessoryId}: ${err.message}`});
  }
};