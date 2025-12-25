import express from 'express';
import * as issuesController from '../controllers/issues.controller.js';
import { validateIssueData } from '../middleware/validation.middleware.js';

const router = express.Router();

// Get all issues
router.get('/', issuesController.getAllIssues);

// Get issue by ID
router.get('/:id', issuesController.getIssueById);

// Create new issue
router.post('/', validateIssueData, issuesController.createIssue);

// Update issue status
router.put('/:id/status', issuesController.updateStatus);

// Update admin notes
router.put('/:id/admin-notes', issuesController.updateAdminNotes);

// Add public comment
router.post('/:id/comments', issuesController.addComment);

export default router;
