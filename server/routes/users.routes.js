import express from 'express';
import * as usersController from '../controllers/users.controller.js';

const router = express.Router();

// Get all users
router.get('/', usersController.getAllUsers);

// Get user issues (must come before /:id to avoid route conflict)
router.get('/:id/issues', usersController.getUserIssues);

// Get user by ID
router.get('/:id', usersController.getUserById);

// Update user
router.put('/:id', usersController.updateUser);

// Update user profile
router.put('/:userId/profile', usersController.updateProfile);

export default router;
