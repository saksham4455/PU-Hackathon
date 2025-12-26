import { readJsonFile, writeJsonFile, getDataFilePaths } from '../utils/database.js';

const { USERS_FILE } = getDataFilePaths();

/**
 * Users Controller
 */

/**
 * Get all users
 */
export async function getAllUsers(req, res) {
    try {
        const usersData = await readJsonFile(USERS_FILE);
        if (!usersData) {
            return res.status(500).json({ error: 'Failed to read users' });
        }
        res.json({ users: usersData.users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
}

/**
 * Get user by ID
 */
export async function getUserById(req, res) {
    try {
        const { id } = req.params;
        const usersData = await readJsonFile(USERS_FILE);

        if (!usersData) {
            return res.status(500).json({ error: 'Failed to read users' });
        }

        const user = usersData.users.find(u => u.id === id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
}

/**
 * Update user
 */
export async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const updates = req.body;

        const usersData = await readJsonFile(USERS_FILE);
        if (!usersData) {
            return res.status(500).json({ error: 'Failed to read users' });
        }

        const userIndex = usersData.users.findIndex(u => u.id === id);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user
        usersData.users[userIndex] = {
            ...usersData.users[userIndex],
            ...updates,
            updated_at: new Date().toISOString()
        };

        if (await writeJsonFile(USERS_FILE, usersData)) {
            res.json({ user: usersData.users[userIndex], message: 'User updated successfully' });
        } else {
            res.status(500).json({ error: 'Failed to save user data' });
        }
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
}

/**
 * Update user profile
 */
export async function updateProfile(req, res) {
    try {
        const { userId } = req.params;
        const { full_name, email, phone, address, bio } = req.body;

        if (!full_name && !email && !phone && !address && !bio) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const usersData = await readJsonFile(USERS_FILE);
        if (!usersData) {
            return res.status(500).json({ error: 'Failed to read users' });
        }

        const userIndex = usersData.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update only provided fields
        if (full_name) usersData.users[userIndex].full_name = full_name;
        if (email) usersData.users[userIndex].email = email;
        if (phone !== undefined) usersData.users[userIndex].phone = phone;
        if (address !== undefined) usersData.users[userIndex].address = address;
        if (bio !== undefined) usersData.users[userIndex].bio = bio;

        usersData.users[userIndex].updated_at = new Date().toISOString();

        if (await writeJsonFile(USERS_FILE, usersData)) {
            res.json({ user: usersData.users[userIndex], message: 'Profile updated successfully' });
        } else {
            res.status(500).json({ error: 'Failed to save user data' });
        }
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
}

/**
 * Get all issues for a specific user
 */
export async function getUserIssues(req, res) {
    try {
        const { id } = req.params;
        const { ISSUES_FILE } = getDataFilePaths();

        const issuesData = await readJsonFile(ISSUES_FILE);
        if (!issuesData) {
            return res.status(500).json({ error: 'Failed to read issues' });
        }

        // Filter issues by user_id
        const userIssues = issuesData.issues.filter(issue => issue.user_id === id);

        res.json({ issues: userIssues });
    } catch (error) {
        console.error('Get user issues error:', error);
        res.status(500).json({ error: 'Failed to get user issues' });
    }
}
