// backend/controllers/supplier.controller.js
const db = require("../models");
const Supplier = db.supplier;
const Website = db.website; // Website model bhi chahiye hoga association ke liye

// Create and Save a new Supplier
exports.create = (req, res) => {
  if (!req.body.name) {
    return res.status(400).send({ message: "Supplier name can not be empty!" });
  }
  const supplier = {
    name: req.body.name,
    contact_person: req.body.contact_person,
    phone: req.body.phone,
    email: req.body.email,
    address: req.body.address,
  };
  Supplier.create(supplier)
    .then(data => {
      // If websites are provided in request body (e.g., as an array of website IDs)
      // We can associate them here. Example:
      if (req.body.websiteIds && req.body.websiteIds.length > 0) {
        Website.findAll({ where: { id: req.body.websiteIds } })
          .then(websites => {
            if (websites && websites.length > 0) {
              data.setWebsites(websites).then(() => { // Sequelize's auto-generated method
                res.status(201).send(data);
              });
            } else {
              res.status(201).send(data); // Send data even if no valid websites found to associate
            }
          });
      } else {
        res.status(201).send(data);
      }
    })
    .catch(err => {
      res.status(500).send({ message: err.message || "Error creating Supplier." });
    });
};

// Retrieve all Suppliers
exports.findAll = (req, res) => {
  Supplier.findAll({ include: [{ model: Website, as: 'websites', attributes: ['id', 'name', 'url'], through: { attributes: [] } }] }) // Include associated websites
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({ message: err.message || "Error retrieving suppliers." });
    });
};

// Find a single Supplier with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  Supplier.findByPk(id, { include: [{ model: Website, as: 'websites', attributes: ['id', 'name', 'url'], through: { attributes: [] } }] })
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({ message: `Supplier with id=${id} not found.` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Error retrieving Supplier with id=" + id });
    });
};

// Update a Supplier by the id
exports.update = (req, res) => {
  const id = req.params.id;
  Supplier.update(req.body, { where: { id: id } })
    .then(num => {
      if (num == 1) {
        // Optionally, update website associations if websiteIds are passed
        if (req.body.websiteIds) {
            Supplier.findByPk(id).then(supplier => {
                if (supplier) {
                    Website.findAll({ where: { id: req.body.websiteIds } }).then(websites => {
                        supplier.setWebsites(websites).then(() => {
                            res.send({ message: "Supplier and associations were updated successfully." });
                        });
                    });
                } else {
                     res.send({ message: "Supplier was updated, but could not find to update associations." });
                }
            });
        } else {
            res.send({ message: "Supplier was updated successfully." });
        }
      } else {
        res.status(404).send({ message: `Cannot update Supplier with id=${id}. Maybe not found or req.body is empty!`});
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Error updating Supplier with id=" + id });
    });
};

// Delete a Supplier with the specified id
exports.delete = (req, res) => {
  const id = req.params.id;
  // When a supplier is deleted, its associations in the junction table are also automatically removed by Sequelize.
  Supplier.destroy({ where: { id: id } })
    .then(num => {
      if (num == 1) {
        res.send({ message: "Supplier was deleted successfully!" });
      } else {
        res.status(404).send({ message: `Cannot delete Supplier with id=${id}. Maybe not found!`});
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Could not delete Supplier with id=" + id });
    });
};


// --- Controller methods for Website-Supplier associations ---
exports.addWebsiteToSupplier = (req, res) => {
    const supplierId = req.params.supplierId;
    const websiteId = req.body.websiteId; // Assuming websiteId is sent in request body

    if (!websiteId) {
        return res.status(400).send({ message: "Website ID cannot be empty!" });
    }

    Supplier.findByPk(supplierId)
        .then(supplier => {
            if (!supplier) {
                return res.status(404).send({ message: "Supplier not found!" });
            }
            Website.findByPk(websiteId).then(website => {
                if (!website) {
                    return res.status(404).send({ message: "Website not found!" });
                }
                supplier.addWebsite(website) // Sequelize's auto-generated method
                    .then(() => {
                        res.send({ message: `Website id=${websiteId} added to Supplier id=${supplierId}` });
                    })
                    .catch(err => {
                         res.status(500).send({ message: `Error adding website to supplier: ${err.message}` });
                    });
            });
        })
        .catch(err => {
            res.status(500).send({ message: `Error finding supplier: ${err.message}` });
        });
};

exports.findSupplierWebsites = (req, res) => {
    const supplierId = req.params.supplierId;
    Supplier.findByPk(supplierId, { include: [{ model: Website, as: 'websites', attributes: ['id', 'name', 'url'], through: { attributes: [] } }] })
        .then(supplier => {
            if (!supplier) {
                return res.status(404).send({ message: "Supplier not found!" });
            }
            res.send(supplier.websites);
        })
        .catch(err => {
            res.status(500).send({ message: `Error retrieving websites for supplier: ${err.message}` });
        });
};

exports.removeWebsiteFromSupplier = (req, res) => {
    const supplierId = req.params.supplierId;
    const websiteId = req.params.websiteId;

    Supplier.findByPk(supplierId)
        .then(supplier => {
            if (!supplier) {
                return res.status(404).send({ message: "Supplier not found!" });
            }
            Website.findByPk(websiteId).then(website => {
                if (!website) {
                    return res.status(404).send({ message: "Website not found!" });
                }
                supplier.removeWebsite(website) // Sequelize's auto-generated method
                    .then(() => {
                        res.send({ message: `Website id=${websiteId} removed from Supplier id=${supplierId}` });
                    })
                    .catch(err => {
                         res.status(500).send({ message: `Error removing website from supplier: ${err.message}` });
                    });
            });
        })
        .catch(err => {
            res.status(500).send({ message: `Error finding supplier: ${err.message}` });
        });
};