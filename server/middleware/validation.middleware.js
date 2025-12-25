/**
 * Validation Middleware
 */

/**
 * Validate issue creation data
 */
export function validateIssueData(req, res, next) {
    const { user_id, issue_type, description } = req.body;

    if (!user_id || !issue_type || !description) {
        return res.status(400).json({
            error: 'Missing required fields',
            required: ['user_id', 'issue_type', 'description']
        });
    }

    next();
}

/**
 * Validate user registration data
 */
export function validateUserData(req, res, next) {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
        return res.status(400).json({
            error: 'Missing required fields',
            required: ['email', 'password', 'fullName']
        });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            error: 'Invalid email format'
        });
    }

    next();
}

/**
 * Validate login data
 */
export function validateLoginData(req, res, next) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: 'Missing email or password'
        });
    }

    next();
}
