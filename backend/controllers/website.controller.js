// backend/controllers/website.controller.js
const db = require("../models");
const Website = db.website;
// const Op = db.Sequelize.Op; // Agar searching/filtering mein zaroorat pare

// Create and Save a new Website
exports.create = (req, res) => {
  // Validate request
  if (!req.body.name) {
    res.status(400).send({ message: "Website name can not be empty!" });
    return;
  }

  // Create a Website object
  const website = {
    name: req.body.name,
    url: req.body.url,
    description: req.body.description
  };

  // Save Website in the database
  Website.create(website)
    .then(data => {
      res.status(201).send(data); // Send 201 Created status
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Website."
      });
    });
};

// Retrieve all Websites from the database.
exports.findAll = (req, res) => {
  // For now, very simple findAll. We can add pagination, searching, filtering later.
  Website.findAll()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving websites."
      });
    });
};

// Find a single Website with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Website.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Website with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Website with id=" + id
      });
    });
};

// Update a Website by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  // It's good practice to prevent updating the name to an existing one if it's unique,
  // but for simplicity in this initial CRUD, we are directly updating.
  // More complex validation can be added.
  Website.update(req.body, { // req.body should contain fields to update
    where: { id: id }
  })
  .then(num => {
    if (num == 1) { // num is the number of affected rows
      res.send({ message: "Website was updated successfully." });
    } else {
      res.status(404).send({ // Or 400 if bad request, depending on why update failed
        message: `Cannot update Website with id=${id}. Maybe Website was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    res.status(500).send({
      message: "Error updating Website with id=" + id
    });
  });
};

// Delete a Website with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Website.destroy({
    where: { id: id }
  })
  .then(num => {
    if (num == 1) {
      res.send({ message: "Website was deleted successfully!" });
    } else {
      res.status(404).send({
        message: `Cannot delete Website with id=${id}. Maybe Website was not found!`
      });
    }
  })
  .catch(err => {
    res.status(500).send({
      message: "Could not delete Website with id=" + id
    });
  });
};

// Optional: Delete all Websites from the database. (Use with extreme caution)
exports.deleteAll = (req, res) => {
  Website.destroy({
    where: {},
    truncate: false // If true, TRUNCATE TABLE will be used (faster but less safe)
  })
  .then(nums => {
    res.send({ message: `${nums} Websites were deleted successfully!` });
  })
  .catch(err => {
    res.status(500).send({
      message: err.message || "Some error occurred while removing all websites."
    });
  });
};