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
        const issuesData = await readJsonFile(ISSUES_FILE);
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
        const issuesData = await readJsonFile(ISSUES_FILE);

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

        const issuesData = await readJsonFile(ISSUES_FILE);
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

        if (await writeJsonFile(ISSUES_FILE, issuesData)) {
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
 * Update status
 */
export async function updateStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, changedBy, changedByName, comment } = req.body;

        const issuesData = await readJsonFile(ISSUES_FILE);
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

        if (await writeJsonFile(ISSUES_FILE, issuesData)) {
            res.json({ issue, message: 'Status updated successfully' });
        } else {
            res.status(500).json({ error: 'Failed to save issue' });
        }
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
}

export const assignIssue = async (req, res) => {
    try {
        const { id } = req.params;
        const { worker_id, worker_name, assigned_by } = req.body;

        const issuesData = await readJsonFile(ISSUES_FILE);
        if (!issuesData) {
            return res.status(500).json({ error: 'Failed to read issues data' });
        }

        const issueIndex = issuesData.issues.findIndex(i => i.id === id);
        if (issueIndex === -1) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        const issue = issuesData.issues[issueIndex];
        const oldStatus = issue.status;

        issue.assigned_to_worker_id = worker_id;
        issue.assigned_to_worker_name = worker_name;
        issue.assigned_by = assigned_by;
        issue.assigned_at = new Date().toISOString();
        issue.status = 'in_progress';
        issue.updated_at = new Date().toISOString();

        // Add to status history
        if (!issue.status_history) {
            issue.status_history = [];
        }

        issue.status_history.push({
            id: generateId(),
            issue_id: id,
            old_status: oldStatus,
            new_status: 'in_progress',
            changed_by: assigned_by,
            changed_by_name: assigned_by,
            changed_at: new Date().toISOString(),
            comment: `Issue assigned to ${worker_name}`
        });

        if (await writeJsonFile(ISSUES_FILE, issuesData)) {
            res.json({ issue, message: 'Issue assigned successfully' });
        } else {
            res.status(500).json({ error: 'Failed to save issue' });
        }
    } catch (error) {
        console.error('Assign issue error:', error);
        res.status(500).json({ error: 'Failed to assign issue' });
    }
}

/**
 * Update admin notes
 */
export async function updateAdminNotes(req, res) {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        const issuesData = await readJsonFile(ISSUES_FILE);
        if (!issuesData) {
            return res.status(500).json({ error: 'Failed to read issues' });
        }

        const issueIndex = issuesData.issues.findIndex(i => i.id === id);
        if (issueIndex === -1) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        issuesData.issues[issueIndex].admin_notes = adminNotes;
        issuesData.issues[issueIndex].updated_at = new Date().toISOString();

        if (await writeJsonFile(ISSUES_FILE, issuesData)) {
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

        const issuesData = await readJsonFile(ISSUES_FILE);
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

        if (await writeJsonFile(ISSUES_FILE, issuesData)) {
            res.json({ comment: newComment, message: 'Comment added successfully' });
        } else {
            res.status(500).json({ error: 'Failed to save comment' });
        }
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
}
