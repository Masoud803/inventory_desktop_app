// backend/controllers/category.controller.js
const db = require("../models");
const Category = db.category;
const Website = db.website; // To check if website exists before associating

// Create and Save a new Category
exports.create = (req, res) => {
  if (!req.body.name || !req.body.website_id) { // website_id is mandatory
    return res.status(400).send({ message: "Category name and website_id can not be empty!" });
  }

  Website.findByPk(req.body.website_id)
    .then(website => {
      if (!website) {
        return res.status(404).send({ message: `Website with id=${req.body.website_id} not found. Category cannot be created.` });
      }
      const category = {
        name: req.body.name,
        description: req.body.description,
        website_id: req.body.website_id,
        parent_id: req.body.parent_id || null 
      };
      Category.create(category)
        .then(data => {
          res.status(201).send(data);
        })
        .catch(err => {
          res.status(500).send({ message: err.message || "Error creating Category." });
        });
    })
    .catch(err => {
        res.status(500).send({ message: `Error finding website: ${err.message}` });
    });
};

// Retrieve all Categories from the database
exports.findAll = (req, res) => {
  const website_id = req.query.websiteId; 
  let condition = {};
  if (website_id) {
    condition.website_id = website_id;
  }

  Category.findAll({ 
    where: condition,
    include: [ 
      { 
        model: Category, 
        as: 'subCategories',
        include: [ // <<--- NESTED INCLUDE FOR SUB-CATEGORIES
          { model: Website, as: 'website', attributes: ['id', 'name'] },
          { model: Category, as: 'parentCategory', attributes: ['id', 'name'] }
          // We can add another level of 'subCategories' here if needed:
          // { model: Category, as: 'subCategories', include: [ /* further nesting */ ]}
        ]
      },
      { model: Category, as: 'parentCategory', attributes: ['id', 'name'] },
      { model: Website, as: 'website', attributes: ['id', 'name']}
    ]
  })
  .then(data => {
    res.send(data);
  })
  .catch(err => {
    res.status(500).send({ message: err.message || "Error retrieving categories." });
  });
};

// Retrieve all Categories for a specific Website
exports.findAllByWebsite = (req, res) => {
  const websiteId = req.params.websiteId;
  Category.findAll({ 
    where: { website_id: websiteId },
    include: [
      { 
        model: Category, 
        as: 'subCategories',
        include: [ // <<--- NESTED INCLUDE FOR SUB-CATEGORIES
          { model: Website, as: 'website', attributes: ['id', 'name'] }, // Sub-category's website (should be same as parent)
          { model: Category, as: 'parentCategory', attributes: ['id', 'name'] } // Parent of sub-category (which is the current category)
        ]
      },
      { model: Category, as: 'parentCategory', attributes: ['id', 'name'] }
      // Website info for the main categories is implicitly handled by the where clause,
      // but if you need the Website object explicitly:
      // { model: Website, as: 'website', attributes: ['id', 'name']}
    ]
  })
  .then(data => {
    res.send(data);
  })
  .catch(err => {
    res.status(500).send({ message: err.message || `Error retrieving categories for Website id=${websiteId}.`});
  });
};

// Find a single Category with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  Category.findByPk(id, { 
    include: [
      { 
        model: Category, 
        as: 'subCategories',
        include: [ // <<--- NESTED INCLUDE FOR SUB-CATEGORIES
          { model: Website, as: 'website', attributes: ['id', 'name'] },
          { model: Category, as: 'parentCategory', attributes: ['id', 'name'] }
        ]
      },
      { model: Category, as: 'parentCategory', attributes: ['id', 'name'] },
      { model: Website, as: 'website', attributes: ['id', 'name']}
    ] 
  })
  .then(data => {
    if (data) {
      res.send(data);
    } else {
      res.status(404).send({ message: `Category with id=${id} not found.` });
    }
  })
  .catch(err => {
    res.status(500).send({ message: "Error retrieving Category with id=" + id });
  });
};

// Update a Category by the id
exports.update = (req, res) => {
  const id = req.params.id;
  Category.update(req.body, { where: { id: id } })
    .then(num => {
      if (num == 1) {
        res.send({ message: "Category was updated successfully." });
      } else {
        res.status(404).send({ message: `Cannot update Category with id=${id}. Maybe not found or req.body is empty!`});
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Error updating Category with id=" + id });
    });
};

// Delete a Category with the specified id
exports.delete = (req, res) => {
  const id = req.params.id;
  Category.destroy({ where: { id: id } })
    .then(num => {
      if (num == 1) {
        res.send({ message: "Category was deleted successfully!" });
      } else {
        res.status(404).send({ message: `Cannot delete Category with id=${id}. Maybe not found!`});
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Could not delete Category with id=" + id });
    });
};