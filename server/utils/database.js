import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

/**
 * Read JSON file synchronously
 * @param {string} filePath - Path to JSON file
 * @returns {object} Parsed JSON data
 */
export function readJsonFileSync(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return null;
    }
}

/**
 * Read JSON file asynchronously
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<object>} Parsed JSON data
 */
export async function readJsonFile(filePath) {
    try {
        const data = await fsPromises.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return null;
    }
}

/**
 * Write JSON file synchronously
 * @param {string} filePath - Path to JSON file
 * @param {object} data - Data to write
 * @returns {boolean} Success status
 */
export function writeJsonFileSync(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        return false;
    }
}

/**
 * Write JSON file asynchronously
 * @param {string} filePath - Path to JSON file
 * @param {object} data - Data to write
 * @returns {Promise<boolean>} Success status
 */
export async function writeJsonFile(filePath, data) {
    try {
        await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        return false;
    }
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

/**
 * Initialize data files if they don't exist
 */
export function initializeDataFiles() {
    const USERS_FILE = path.join(DATA_DIR, 'users.json');
    const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');
    const ISSUES_FILE = path.join(DATA_DIR, 'issues.json');

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Initialize users.json
    if (!fs.existsSync(USERS_FILE)) {
        writeJsonFileSync(USERS_FILE, { users: [] });
    }

    // Initialize admins.json
    if (!fs.existsSync(ADMINS_FILE)) {
        writeJsonFileSync(ADMINS_FILE, { admins: [] });
    }

    // Initialize issues.json
    if (!fs.existsSync(ISSUES_FILE)) {
        writeJsonFileSync(ISSUES_FILE, { issues: [] });
    }
}

/**
 * Get file paths
 */
export function getDataFilePaths() {
    return {
        USERS_FILE: path.join(DATA_DIR, 'users.json'),
        ADMINS_FILE: path.join(DATA_DIR, 'admins.json'),
        ISSUES_FILE: path.join(DATA_DIR, 'issues.json'),
        DATA_DIR
    };
}
