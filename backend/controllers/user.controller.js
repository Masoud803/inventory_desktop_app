// backend/controllers/user.controller.js
const db = require("../models");
const User = db.user;
const bcrypt = require("bcryptjs");

// --- Test Board Functions ---
exports.allAccess = (req, res) => {
  res.status(200).send("Public Content - Anyone can access this.");
};
exports.userBoard = (req, res) => {
  res.status(200).send(`User Content - Hello ${req.username} (ID: ${req.userId}, Role: ${req.userRole}).`);
};
exports.adminBoard = (req, res) => {
  res.status(200).send(`Admin Content - Hello ${req.username} (ID: ${req.userId}, Role: ${req.userRole}).`);
};
exports.superAdminBoard = (req, res) => {
  res.status(200).send(`Super Admin Content - Hello ${req.username} (ID: ${req.userId}, Role: ${req.userRole}).`);
};

// --- Admin User Management Functions (Further Updated) ---

// Retrieve all Users (Admin can see users and admins; SuperAdmin sees all)
exports.findAllUsers = async (req, res) => {
  const loggedInUserRole = req.userRole;
  let condition = {};

  if (loggedInUserRole === 'admin') {
    // Admin can see users and other admins, but not super_admins
    condition.role = { [db.Sequelize.Op.not]: 'super_admin' };
  }
  // SuperAdmin can see all users (no condition needed for role)

  try {
    const users = await User.findAll({
      where: condition,
      attributes: ['id', 'username', 'email', 'role', 'createdAt', 'updatedAt']
    });
    res.status(200).send(users);
  } catch (err) {
    res.status(500).send({ message: err.message || "Some error occurred while retrieving users." });
  }
};

// Retrieve a single User by ID (Admin can see user/admin; SuperAdmin sees any)
exports.findOneUser = async (req, res) => {
  const targetUserId = req.params.id;
  const loggedInUserRole = req.userRole;

  try {
    const user = await User.findByPk(targetUserId, {
      attributes: ['id', 'username', 'email', 'role', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return res.status(404).send({ message: `User with id=${targetUserId} not found.` });
    }

    // Admin cannot view a super_admin's details
    if (loggedInUserRole === 'admin' && user.role === 'super_admin') {
      return res.status(403).send({ message: "Admin role cannot view Super Admin user details." });
    }

    res.status(200).send(user);
  } catch (err) {
    res.status(500).send({ message: `Error retrieving user with id=${targetUserId}: ${err.message}` });
  }
};

// Create a new User (Admin can only create 'user' role)
exports.createUserByAdmin = async (req, res) => {
  const loggedInUserRole = req.userRole;

  if (!req.body.username || !req.body.email || !req.body.password) {
    return res.status(400).send({ message: "Username, email, and password are required!" });
  }

  // If logged-in user is 'admin', the new user's role MUST be 'user' or not specified (defaults to 'user')
  // Admin cannot specify 'admin' or 'super_admin' for the new user.
  if (loggedInUserRole === 'admin' && req.body.role && req.body.role !== 'user') {
    return res.status(403).send({ message: "Admin can only create users with the 'user' role." });
  }
  // SuperAdmin can specify any role (or defaults to 'user' if not specified)

  try {
    const existingUserByUsername = await User.findOne({ where: { username: req.body.username } });
    if (existingUserByUsername) {
      return res.status(400).send({ message: "Failed! Username is already in use!" });
    }
    const existingUserByEmail = await User.findOne({ where: { email: req.body.email } });
    if (existingUserByEmail) {
      return res.status(400).send({ message: "Failed! Email is already in use!" });
    }

    let newRole = 'user'; // Default role
    if (loggedInUserRole === 'super_admin' && req.body.role) {
        newRole = req.body.role; // SuperAdmin can assign any role
    } else if (loggedInUserRole === 'admin') {
        newRole = 'user'; // Admin always creates 'user'
    }


    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password_hash: bcrypt.hashSync(req.body.password, 8),
      role: newRole
    });
    const { password_hash, ...userData } = user.get({ plain: true });
    res.status(201).send({ message: "User created successfully!", user: userData });

  } catch (err) {
    res.status(500).send({ message: err.message || "Some error occurred while creating the user." });
  }
};

// Update a User by ID (Admin can only update 'user' roles, and cannot change their role)
exports.updateUserByAdmin = async (req, res) => {
  const targetUserId = req.params.id;
  const loggedInUserId = req.userId;
  const loggedInUserRole = req.userRole;

  // Admin cannot edit themselves via this route
  if (loggedInUserRole === 'admin' && parseInt(targetUserId) === loggedInUserId) {
    return res.status(403).send({ message: "Admins should use their profile page for their own details." });
  }

  try {
    const userToUpdate = await User.findByPk(targetUserId);
    if (!userToUpdate) {
      return res.status(404).send({ message: `User with id=${targetUserId} not found.` });
    }

    // **NEW HIERARCHY RULES:**
    // 1. Admin cannot modify a super_admin.
    if (loggedInUserRole === 'admin' && userToUpdate.role === 'super_admin') {
      return res.status(403).send({ message: "Admin cannot modify a Super Admin." });
    }
    // 2. Admin cannot modify another admin.
    if (loggedInUserRole === 'admin' && userToUpdate.role === 'admin' && parseInt(targetUserId) !== loggedInUserId) {
      return res.status(403).send({ message: "Admin cannot modify another Admin." });
    }

    const updateData = {};

    // Username update (with uniqueness)
    if (req.body.username && req.body.username !== userToUpdate.username) {
      const existingUser = await User.findOne({ where: { username: req.body.username } });
      if (existingUser && existingUser.id !== parseInt(targetUserId)) {
        return res.status(400).send({ message: "Username is already in use." });
      }
      updateData.username = req.body.username;
    }

    // Email update (with uniqueness)
    if (req.body.email && req.body.email !== userToUpdate.email) {
      const existingUser = await User.findOne({ where: { email: req.body.email } });
      if (existingUser && existingUser.id !== parseInt(targetUserId)) {
        return res.status(400).send({ message: "Email is already in use." });
      }
      updateData.email = req.body.email;
    }

    // Role change logic (VERY RESTRICTED FOR ADMIN)
    if (req.body.role && req.body.role !== userToUpdate.role) {
      if (loggedInUserRole === 'admin') {
        // Admin cannot change roles at all via this function for other users.
        // They can only create users with 'user' role.
        // If a 'user' needs role change, super_admin must do it.
        return res.status(403).send({ message: "Admin cannot change user roles. Contact Super Admin." });
      }
      // SuperAdmin specific role change logic
      if (loggedInUserRole === 'super_admin') {
        if (parseInt(targetUserId) === loggedInUserId && req.body.role !== 'super_admin') {
          return res.status(403).send({ message: "Super Admin cannot demote themselves." });
        }
        updateData.role = req.body.role; // SuperAdmin can set any role
      }
    }

    // Password change by admin/super_admin
    if (req.body.password) {
      updateData.password_hash = bcrypt.hashSync(req.body.password, 8);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).send({ message: "No data provided for update or data is the same." });
    }

    const [num] = await User.update(updateData, { where: { id: targetUserId } });
    if (num == 1) {
      res.status(200).send({ message: "User was updated successfully." });
    } else {
      res.status(304).send({ message: `User with id=${targetUserId} was not modified. Data might be the same or user not found.` });
    }
  } catch (err) {
    console.error("Error in updateUserByAdmin:", err);
    res.status(500).send({ message: `Error updating user: ${err.message}` });
  }
};

// Delete a User by ID (Admin can only delete 'user' roles; SuperAdmin broader)
exports.deleteUserByAdmin = async (req, res) => {
  const targetUserId = req.params.id;
  const loggedInUserId = req.userId;
  const loggedInUserRole = req.userRole;

  if (parseInt(targetUserId) === loggedInUserId) {
    return res.status(403).send({ message: "You cannot delete yourself using this admin route." });
  }

  try {
    const userToDelete = await User.findByPk(targetUserId);
    if (!userToDelete) {
      return res.status(404).send({ message: `User with id=${targetUserId} not found.` });
    }

    // **NEW HIERARCHY RULES FOR DELETE:**
    // 1. Admin cannot delete a super_admin.
    if (loggedInUserRole === 'admin' && userToDelete.role === 'super_admin') {
      return res.status(403).send({ message: "Admin cannot delete a Super Admin." });
    }
    // 2. Admin cannot delete another admin.
    if (loggedInUserRole === 'admin' && userToDelete.role === 'admin') {
      return res.status(403).send({ message: "Admin cannot delete another Admin." });
    }
    // This means admin can ONLY delete users with 'user' role.

    // SuperAdmin can delete anyone (except self via this route).

    const num = await User.destroy({ where: { id: targetUserId } });
    if (num == 1) {
      res.status(200).send({ message: "User was deleted successfully!" });
    } else {
      res.status(404).send({ message: `Cannot delete user with id=${targetUserId}. Maybe user was not found.` });
    }
  } catch (err) {
    console.error("Error in deleteUserByAdmin:", err);
    res.status(500).send({ message: `Could not delete user: ${err.message}` });
  }
};




// // backend/controllers/user.controller.js
// const db = require("../models");
// const User = db.user;
// const bcrypt = require("bcryptjs"); // For creating/updating password if admin does that

// // --- Test Board Functions (These can remain if you use them for testing authorization) ---
// exports.allAccess = (req, res) => {
//   res.status(200).send("Public Content - Anyone can access this.");
// };
// exports.userBoard = (req, res) => {
//   res.status(200).send(`User Content - Hello ${req.username} (ID: ${req.userId}, Role: ${req.userRole}).`);
// };
// exports.adminBoard = (req, res) => {
//   res.status(200).send(`Admin Content - Hello ${req.username} (ID: ${req.userId}, Role: ${req.userRole}).`);
// };
// exports.superAdminBoard = (req, res) => {
//   res.status(200).send(`Super Admin Content - Hello ${req.username} (ID: ${req.userId}, Role: ${req.userRole}).`);
// };

// // --- Admin User Management Functions ---

// // Retrieve all Users (Admin only)
// exports.findAllUsers = (req, res) => {
//   User.findAll({
//     attributes: ['id', 'username', 'email', 'role', 'createdAt', 'updatedAt'] // Exclude password_hash
//   })
//   .then(users => {
//     res.status(200).send(users);
//   })
//   .catch(err => {
//     res.status(500).send({ message: err.message || "Some error occurred while retrieving users." });
//   });
// };

// // Retrieve a single User by ID (Admin only)
// exports.findOneUser = (req, res) => {
//   const id = req.params.id;
//   User.findByPk(id, {
//     attributes: ['id', 'username', 'email', 'role', 'createdAt', 'updatedAt']
//   })
//   .then(user => {
//     if (user) {
//       res.status(200).send(user);
//     } else {
//       res.status(404).send({ message: `User with id=${id} not found.` });
//     }
//   })
//   .catch(err => {
//     res.status(500).send({ message: `Error retrieving user with id=${id}: ${err.message}` });
//   });
// };

// // Create a new User (Admin only - different from public signup)
// exports.createUserByAdmin = (req, res) => {
//   // Validate request
//   if (!req.body.username || !req.body.email || !req.body.password) {
//     return res.status(400).send({ message: "Username, email, and password are required!" });
//   }
//   // Check for existing username or email (can be a helper function later)
//   User.findOne({ where: { username: req.body.username } }).then(userByUsername => {
//     if (userByUsername) {
//       return res.status(400).send({ message: "Failed! Username is already in use!" });
//     }
//     User.findOne({ where: { email: req.body.email } }).then(userByEmail => {
//       if (userByEmail) {
//         return res.status(400).send({ message: "Failed! Email is already in use!" });
//       }

//       // Create user object
//       User.create({
//         username: req.body.username,
//         email: req.body.email,
//         password_hash: bcrypt.hashSync(req.body.password, 8),
//         role: req.body.role || 'user' // Admin can specify role, defaults to 'user'
//       })
//       .then(user => {
//         const { password_hash, ...userData } = user.get({ plain: true });
//         res.status(201).send({ message: "User created successfully by admin!", user: userData });
//       })
//       .catch(err => {
//         res.status(500).send({ message: err.message || "Some error occurred while creating the user." });
//       });
//     }).catch(err => res.status(500).send({ message: err.message }));
//   }).catch(err => res.status(500).send({ message: err.message }));
// };


// // Update a User by ID (Admin only)
// exports.updateUserByAdmin = (req, res) => {
//   const id = req.params.id;
//   const updateData = {};

//   if (req.body.username) updateData.username = req.body.username;
//   if (req.body.email) updateData.email = req.body.email;
//   if (req.body.role) updateData.role = req.body.role;
//   if (req.body.password) { // If admin wants to change password
//     updateData.password_hash = bcrypt.hashSync(req.body.password, 8);
//   }

//   if (Object.keys(updateData).length === 0) {
//     return res.status(400).send({ message: "No data provided for update." });
//   }

//   // Add checks for username/email uniqueness if they are being updated (similar to create) - can be complex
//   // For now, simple update
//   User.update(updateData, { where: { id: id } })
//     .then(num => {
//       if (num == 1) {
//         res.status(200).send({ message: "User was updated successfully by admin." });
//       } else {
//         res.status(404).send({ message: `Cannot update user with id=${id}. Maybe user was not found or req.body is empty.` });
//       }
//     })
//     .catch(err => {
//       res.status(500).send({ message: `Error updating user with id=${id}: ${err.message}` });
//     });
// };

// // Delete a User by ID (Admin only)
// exports.deleteUserByAdmin = (req, res) => {
//   const id = req.params.id;
//   User.destroy({ where: { id: id } })
//     .then(num => {
//       if (num == 1) {
//         res.status(200).send({ message: "User was deleted successfully by admin!" });
//       } else {
//         res.status(404).send({ message: `Cannot delete user with id=${id}. Maybe user was not found.` });
//       }
//     })
//     .catch(err => {
//       res.status(500).send({ message: `Could not delete user with id=${id}: ${err.message}` });
//     });
// };




// // inventory-app/backend/controllers/user.controller.js
// exports.allAccess = (req, res) => {
//   res.status(200).send("Public Content - Anyone can access this.");
// };

// exports.userBoard = (req, res) => {
//   res.status(200).send(`User Content - Hello ${req.username} (ID: ${req.userId}, Role: ${req.userRole}).`);
// };

// exports.adminBoard = (req, res) => {
//   res.status(200).send(`Admin Content - Hello ${req.username} (ID: ${req.userId}, Role: ${req.userRole}).`);
// };

// exports.superAdminBoard = (req, res) => {
//   res.status(200).send(`Super Admin Content - Hello ${req.username} (ID: ${req.userId}, Role: ${req.userRole}).`);
// };