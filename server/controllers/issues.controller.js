import { readJsonFile, writeJsonFile, generateId, getDataFilePaths } from '../utils/database.js';

const { ISSUES_FILE } = getDataFilePaths();

/**
 * Issues Controller
 */

/**
 * Get all issues
 */
export async function getAllIssues(req, res) {
    try {
        const issuesData = readJsonFile(ISSUES_FILE);
        if (!issuesData) {
            return res.status(500).json({ error: 'Failed to read issues' });
        }
        res.json({ issues: issuesData.issues });
    } catch (error) {
        console.error('Get issues error:', error);
        res.status(500).json({ error: 'Failed to get issues' });
    }
}

/**
 * Get issue by ID
 */
export async function getIssueById(req, res) {
    try {
        const { id } = req.params;
        const issuesData = readJsonFile(ISSUES_FILE);

        if (!issuesData) {
            return res.status(500).json({ error: 'Failed to read issues' });
        }

        const issue = issuesData.issues.find(i => i.id === id);

        if (!issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        res.json({ issue });
    } catch (error) {
        console.error('Get issue error:', error);
        res.status(500).json({ error: 'Failed to get issue' });
    }
}

/**
 * Create new issue
 */
export async function createIssue(req, res) {
    try {
        const issueData = req.body;

        if (!issueData.user_id || !issueData.issue_type || !issueData.description) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const issuesData = readJsonFile(ISSUES_FILE);
        if (!issuesData) {
            return res.status(500).json({ error: 'Failed to read issues' });
        }

        const newIssue = {
            ...issueData,
            id: generateId(),
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            public_comments: [],
            status_history: []
        };

        issuesData.issues.push(newIssue);

        if (writeJsonFile(ISSUES_FILE, issuesData)) {
            res.json({ issue: newIssue, message: 'Issue created successfully' });
        } else {
            res.status(500).json({ error: 'Failed to save issue' });
        }
    } catch (error) {
        console.error('Create issue error:', error);
        res.status(500).json({ error: 'Failed to create issue' });
    }
}

/**
 * Update issue status
 */
export async function updateStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, changedBy, changedByName, comment } = req.body;

        const issuesData = readJsonFile(ISSUES_FILE);
        if (!issuesData) {
            return res.status(500).json({ error: 'Failed to read issues' });
        }

        const issueIndex = issuesData.issues.findIndex(i => i.id === id);
        if (issueIndex === -1) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        const issue = issuesData.issues[issueIndex];
        const oldStatus = issue.status;

        // Update status
        issue.status = status;
        issue.updated_at = new Date().toISOString();

        // Add to status history
        if (!issue.status_history) {
            issue.status_history = [];
        }

        issue.status_history.push({
            id: generateId(),
            issue_id: id,
            old_status: oldStatus,
            new_status: status,
            changed_by: changedBy,
            changed_by_name: changedByName,
            changed_at: new Date().toISOString(),
            comment: comment || ''
        });

        if (writeJsonFile(ISSUES_FILE, issuesData)) {
            res.json({ issue, message: 'Status updated successfully' });
        } else {
            res.status(500).json({ error: 'Failed to save issue' });
        }
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
}

/**
 * Update admin notes
 */
export async function updateAdminNotes(req, res) {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        const issuesData = readJsonFile(ISSUES_FILE);
        if (!issuesData) {
            return res.status(500).json({ error: 'Failed to read issues' });
        }

        const issueIndex = issuesData.issues.findIndex(i => i.id === id);
        if (issueIndex === -1) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        issuesData.issues[issueIndex].admin_notes = adminNotes;
        issuesData.issues[issueIndex].updated_at = new Date().toISOString();

        if (writeJsonFile(ISSUES_FILE, issuesData)) {
            res.json({ issue: issuesData.issues[issueIndex], message: 'Admin notes updated successfully' });
        } else {
            res.status(500).json({ error: 'Failed to save issue' });
        }
    } catch (error) {
        console.error('Update admin notes error:', error);
        res.status(500).json({ error: 'Failed to update admin notes' });
    }
}

/**
 * Add public comment
 */
export async function addComment(req, res) {
    try {
        const { id } = req.params;
        const { comment, authorType, authorId, authorName } = req.body;

        const issuesData = readJsonFile(ISSUES_FILE);
        if (!issuesData) {
            return res.status(500).json({ error: 'Failed to read issues' });
        }

        const issueIndex = issuesData.issues.findIndex(i => i.id === id);
        if (issueIndex === -1) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        const newComment = {
            id: generateId(),
            issue_id: id,
            author_type: authorType,
            author_id: authorId,
            author_name: authorName,
            comment: comment,
            created_at: new Date().toISOString()
        };

        if (!issuesData.issues[issueIndex].public_comments) {
            issuesData.issues[issueIndex].public_comments = [];
        }

        issuesData.issues[issueIndex].public_comments.push(newComment);
        issuesData.issues[issueIndex].updated_at = new Date().toISOString();

        if (writeJsonFile(ISSUES_FILE, issuesData)) {
            res.json({ comment: newComment, message: 'Comment added successfully' });
        } else {
            res.status(500).json({ error: 'Failed to save comment' });
        }
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
}
