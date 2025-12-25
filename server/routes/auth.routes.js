import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateUserData, validateLoginData } from '../middleware/validation.middleware.js';

const router = express.Router();

// User signup
router.post('/signup', validateUserData, authController.signup);

// User login
router.post('/login', validateLoginData, authController.login);

export default router;
