// Simple Express server to handle JSON file operations
import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import upload, { processUploadedFile, serveSecureFile } from './fileUploadSecurity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NOTE: Multer configuration has been moved to fileUploadSecurity.js
// The new secure upload module provides:
// - Magic number file type validation
// - UUID-based secure filenames
// - Image optimization and resizing
// - Enhanced security checks

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: '*', // Be careful with this in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add security headers middleware
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*; connect-src 'self' *"
  );
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// Configure MIME types
const mimeTypes = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.cjs': 'text/javascript',
  '.ts': 'text/javascript',
  '.tsx': 'text/javascript',
  '.jsx': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.map': 'application/json'
};

// Custom static file serving with MIME types
const serveStatic = (directory) => {
  return (req, res, next) => {
    const filePath = path.join(directory, req.path);
    const ext = path.extname(filePath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const mimeType = mimeTypes[ext] || 'text/plain';
      // Set proper headers for JavaScript/TypeScript modules
      if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx' || ext === '.mjs') {
        res.setHeader('Content-Type', 'text/javascript');
        // Add CORS headers for modules
        res.setHeader('Access-Control-Allow-Origin', '*');
      } else {
        res.setHeader('Content-Type', mimeType);
      }
      res.sendFile(filePath);
    } else {
      next();
    }
  };
};

// Serve static files from build/dist directories
app.use('/admin', express.static(path.join(__dirname, 'Admin', 'dist')));
app.use(express.static(path.join(__dirname, 'dist')));

// Data file paths
const DATA_DIR = path.join(__dirname, 'src', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');
const ISSUES_FILE = path.join(DATA_DIR, 'issues.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files if they don't exist
const initializeDataFiles = () => {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
  }
  if (!fs.existsSync(ADMINS_FILE)) {
    fs.writeFileSync(ADMINS_FILE, JSON.stringify({
      admins: [
        {
          id: 'admin-1',
          email: 'admin@city.gov',
          password: 'admin123',
          full_name: 'City Administrator',
          role: 'admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]
    }, null, 2));
  }
  if (!fs.existsSync(ISSUES_FILE)) {
    fs.writeFileSync(ISSUES_FILE, JSON.stringify({ issues: [] }, null, 2));
  }
};

// Initialize on startup
initializeDataFiles();

// Helper function to read JSON file
const readJsonFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
};

// Helper function to write JSON file
const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
};

// Routes

// Get all users
app.get('/api/users', (req, res) => {
  const usersData = readJsonFile(USERS_FILE);
  res.json(usersData);
});

// Create new user
app.post('/api/users', (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const usersData = readJsonFile(USERS_FILE);
  const adminsData = readJsonFile(ADMINS_FILE);

  // Check if user already exists
  const existingUser = usersData.users.find(u => u.email === email);
  const existingAdmin = adminsData.admins.find(a => a.email === email);

  if (existingUser || existingAdmin) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  // Create new user
  const newUser = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    email,
    password,
    full_name: fullName,
    role: 'citizen',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  usersData.users.push(newUser);

  if (writeJsonFile(USERS_FILE, usersData)) {
    res.json({ user: newUser, message: 'User created successfully' });
  } else {
    res.status(500).json({ error: 'Failed to save user data' });
  }
});

// Authenticate user
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  const usersData = readJsonFile(USERS_FILE);
  const adminsData = readJsonFile(ADMINS_FILE);

  // Check citizens first
  const user = usersData.users.find(u => u.email === email && u.password === password);
  if (user) {
    return res.json({ user, message: 'Login successful' });
  }

  // Check admins
  const admin = adminsData.admins.find(a => a.email === email && a.password === password);
  if (admin) {
    return res.json({ user: admin, message: 'Admin login successful' });
  }

  res.status(401).json({ error: 'Invalid email or password' });
});

// Update user profile
app.put('/api/users/:userId', (req, res) => {
  const { userId } = req.params;
  const { full_name, email } = req.body;

  if (!full_name && !email) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const usersData = readJsonFile(USERS_FILE);
  const userIndex = usersData.users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if email is being changed and if it already exists
  if (email && email !== usersData.users[userIndex].email) {
    const existingUser = usersData.users.find(u => u.email === email && u.id !== userId);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
  }

  // Update user data
  if (full_name) {
    usersData.users[userIndex].full_name = full_name;
  }
  if (email) {
    usersData.users[userIndex].email = email;
  }
  usersData.users[userIndex].updated_at = new Date().toISOString();

  if (writeJsonFile(USERS_FILE, usersData)) {
    res.json({ user: usersData.users[userIndex], message: 'Profile updated successfully' });
  } else {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get all issues
app.get('/api/issues', (req, res) => {
  const issuesData = readJsonFile(ISSUES_FILE);
  res.json(issuesData);
});

// Create new issue with file uploads (form data)
app.post('/api/issues/upload', upload.array('files', 5), (req, res) => {
  try {
    const issueData = JSON.parse(req.body.data); // Get JSON data from the form
    const files = req.files; // Get uploaded files

    if (!issueData.user_id || !issueData.issue_type || !issueData.description) {
      // Clean up any uploaded files if validation fails
      if (files) {
        files.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const issuesData = readJsonFile(ISSUES_FILE);

    // Process uploaded files
    const attachments = files ? files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path.replace(__dirname, '').replace(/\\/g, '/'),
      mimetype: file.mimetype,
      size: file.size
    })) : [];

    const newIssue = {
      ...issueData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      attachments,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    issuesData.issues.push(newIssue);

    if (writeJsonFile(ISSUES_FILE, issuesData)) {
      res.json({ issue: newIssue, message: 'Issue created successfully' });
    } else {
      // Clean up uploaded files if saving fails
      attachments.forEach(file => {
        fs.unlinkSync(path.join(__dirname, file.path));
      });
      res.status(500).json({ error: 'Failed to save issue data' });
    }
  } catch (error) {
    console.error('Error creating issue:', error);
    // Clean up any uploaded files if there's an error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
    }
    res.status(500).json({ error: 'Failed to create issue: ' + error.message });
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Create new issue (JSON data)
app.post('/api/issues', (req, res) => {
  try {
    const issueData = req.body;

    if (!issueData.user_id || !issueData.issue_type || !issueData.description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const issuesData = readJsonFile(ISSUES_FILE);

    const newIssue = {
      ...issueData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    issuesData.issues.push(newIssue);

    if (writeJsonFile(ISSUES_FILE, issuesData)) {
      res.json({ issue: newIssue, message: 'Issue created successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save issue data' });
    }
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: 'Failed to create issue: ' + error.message });
  }
});

// Update issue status
app.put('/api/issues/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, changed_by, changed_by_name, comment } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const issuesData = readJsonFile(ISSUES_FILE);
  const issueIndex = issuesData.issues.findIndex(issue => issue.id === id);

  if (issueIndex === -1) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  const issue = issuesData.issues[issueIndex];
  const oldStatus = issue.status;

  // Only update if status actually changed
  if (oldStatus !== status) {
    // Initialize status_history if it doesn't exist
    if (!issue.status_history) {
      issue.status_history = [];
    }

    // Add status change to history
    const statusChange = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      issue_id: id,
      old_status: oldStatus,
      new_status: status,
      changed_by: changed_by || 'system',
      changed_by_name: changed_by_name || 'System',
      changed_at: new Date().toISOString(),
      comment: comment || null
    };

    issue.status_history.push(statusChange);
    issue.status = status;
    issue.updated_at = new Date().toISOString();
  }

  if (writeJsonFile(ISSUES_FILE, issuesData)) {
    res.json({ issue: issuesData.issues[issueIndex], message: 'Issue updated successfully' });
  } else {
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

// Get user issues
app.get('/api/users/:userId/issues', (req, res) => {
  const { userId } = req.params;
  const issuesData = readJsonFile(ISSUES_FILE);
  const userIssues = issuesData.issues.filter(issue => issue.user_id === userId);
  res.json({ issues: userIssues });
});

// Get issue by ID
app.get('/api/issues/:id', (req, res) => {
  const { id } = req.params;
  const issuesData = readJsonFile(ISSUES_FILE);
  const issue = issuesData.issues.find(issue => issue.id === id);

  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  res.json({ issue });
});

// Add public comment to issue
app.post('/api/issues/:id/comments', (req, res) => {
  const { id } = req.params;
  const { comment, author_type, author_id, author_name } = req.body;

  if (!comment || !author_type || !author_id || !author_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const issuesData = readJsonFile(ISSUES_FILE);
  const issueIndex = issuesData.issues.findIndex(issue => issue.id === id);

  if (issueIndex === -1) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  const newComment = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    issue_id: id,
    author_type,
    author_id,
    author_name,
    comment,
    created_at: new Date().toISOString()
  };

  // Initialize public_comments array if it doesn't exist
  if (!issuesData.issues[issueIndex].public_comments) {
    issuesData.issues[issueIndex].public_comments = [];
  }

  issuesData.issues[issueIndex].public_comments.push(newComment);
  issuesData.issues[issueIndex].updated_at = new Date().toISOString();

  if (writeJsonFile(ISSUES_FILE, issuesData)) {
    res.json({ comment: newComment, message: 'Comment added successfully' });
  } else {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Update issue admin notes
app.put('/api/issues/:id/admin-notes', (req, res) => {
  const { id } = req.params;
  const { admin_notes } = req.body;

  if (admin_notes === undefined) {
    return res.status(400).json({ error: 'Admin notes are required' });
  }

  const issuesData = readJsonFile(ISSUES_FILE);
  const issueIndex = issuesData.issues.findIndex(issue => issue.id === id);

  if (issueIndex === -1) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  issuesData.issues[issueIndex].admin_notes = admin_notes;
  issuesData.issues[issueIndex].updated_at = new Date().toISOString();

  if (writeJsonFile(ISSUES_FILE, issuesData)) {
    res.json({ issue: issuesData.issues[issueIndex], message: 'Admin notes updated successfully' });
  } else {
    res.status(500).json({ error: 'Failed to update admin notes' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// SPA fallback routes
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'Admin', 'dist', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  console.log(`Access from other devices using http://192.168.1.4:${PORT}`);
  console.log(`Data files location: ${DATA_DIR}`);
});
