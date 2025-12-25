import { readJsonFile, writeJsonFile, generateId, getDataFilePaths } from '../utils/database.js';

const { USERS_FILE } = getDataFilePaths();

/**
 * Authentication Controller
 */

/**
 * User signup
 */
export async function signup(req, res) {
    try {
        const { email, password, fullName } = req.body;

        const usersData = readJsonFile(USERS_FILE);
        if (!usersData) {
            return res.status(500).json({ error: 'Failed to read user data' });
        }

        // Check if user already exists
        const existingUser = usersData.users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create new user
        const newUser = {
            id: generateId(),
            email,
            password, // In production, hash this!
            full_name: fullName,
            role: 'citizen',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            reputation_points: 0,
            badges: [],
            issues_reported: 0,
            issues_resolved: 0
        };

        usersData.users.push(newUser);

        if (writeJsonFile(USERS_FILE, usersData)) {
            res.json({ user: newUser, message: 'User created successfully' });
        } else {
            res.status(500).json({ error: 'Failed to save user data' });
        }
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Signup failed' });
    }
}

/**
 * User login
 */
export async function login(req, res) {
    try {
        const { email, password } = req.body;

        const usersData = readJsonFile(USERS_FILE);
        const adminsData = readJsonFile(getDataFilePaths().ADMINS_FILE);

        // Check in users
        const user = usersData?.users.find(u => u.email === email && u.password === password);
        if (user) {
            return res.json({ user, message: 'Login successful' });
        }

        // Check in admins
        const admin = adminsData?.admins.find(a => a.email === email && a.password === password);
        if (admin) {
            return res.json({ user: admin, message: 'Admin login successful' });
        }

        res.status(401).json({ error: 'Invalid email or password' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
}
