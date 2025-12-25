// Enhanced file upload security module
import multer from 'multer';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Secure upload directories
const UPLOAD_DIRS = {
    images: path.join(__dirname, 'uploads', 'secure', 'images'),
    videos: path.join(__dirname, 'uploads', 'secure', 'videos'),
    documents: path.join(__dirname, 'uploads', 'secure', 'documents')
};

// Ensure all upload directories exist
Object.values(UPLOAD_DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// File size limits (in bytes)
const SIZE_LIMITS = {
    image: 10 * 1024 * 1024,  // 10MB for images
    video: 50 * 1024 * 1024,  // 50MB for videos
    document: 5 * 1024 * 1024 // 5MB for documents
};

// Allowed file types with magic numbers
const ALLOWED_TYPES = {
    image: {
        'image/jpeg': [0xFF, 0xD8, 0xFF],
        'image/png': [0x89, 0x50, 0x4E, 0x47],
        'image/gif': [0x47, 0x49, 0x46],
        'image/webp': [0x52, 0x49, 0x46, 0x46]
    },
    video: {
        'video/mp4': [0x66, 0x74, 0x79, 0x70],
        'video/quicktime': [0x66, 0x74, 0x79, 0x70]
    }
};

// Sanitize filename to prevent path traversal
export function sanitizeFilename(filename) {
    // Remove all dangerous characters and patterns
    return filename
        .replace(/\.\./g, '')  // Remove double dots
        .replace(/[\/\\]/g, '_')  // Replace slashes with underscores
        .replace(/[^a-zA-Z0-9._-]/g, '_');  // Replace other special chars
}


// Generate secure random filename
export function generateSecureFilename(originalName) {
    const ext = path.extname(originalName).toLowerCase();
    // Only keep safe characters in extension
    const safeExt = ext.replace(/[^a-z0-9.]/g, '');
    return `${uuidv4()}${safeExt}`;
}


// Validate file type using magic numbers
export async function validateFileType(buffer, declaredMimetype) {
    try {
        const detectedType = await fileTypeFromBuffer(buffer);

        if (!detectedType) {
            return { valid: false, error: 'Could not detect file type' };
        }

        // Check if detected type matches declared mimetype
        if (detectedType.mime !== declaredMimetype) {
            return {
                valid: false,
                error: `File type mismatch. Detected: ${detectedType.mime}, Declared: ${declaredMimetype}`
            };
        }

        // Check if file type is allowed
        const isImageType = Object.keys(ALLOWED_TYPES.image).includes(detectedType.mime);
        const isVideoType = Object.keys(ALLOWED_TYPES.video).includes(detectedType.mime);

        if (!isImageType && !isVideoType) {
            return { valid: false, error: 'File type not allowed' };
        }

        return {
            valid: true,
            type: isImageType ? 'image' : 'video',
            mimetype: detectedType.mime
        };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

// Optimize and resize images
export async function optimizeImage(inputPath, outputPath) {
    try {
        await sharp(inputPath)
            .resize(2048, 2048, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .rotate() // Auto-rotate based on EXIF orientation
            .webp({ quality: 85 }) // Convert to WebP with 85% quality
            .toFile(outputPath);

        // Delete original file
        fs.unlinkSync(inputPath);

        return { success: true, path: outputPath };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Configure multer with memory storage for validation
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // Maximum 50MB (will be checked individually)
        files: 5 // Max 5 files per upload
    }
});

// Enhanced file upload middleware
export async function processUploadedFile(file) {
    try {
        // Validate file type using magic numbers
        const validation = await validateFileType(file.buffer, file.mimetype);

        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        // Check file size limit based on type
        const sizeLimit = SIZE_LIMITS[validation.type];
        if (file.size > sizeLimit) {
            return {
                success: false,
                error: `File size exceeds limit. Maximum ${sizeLimit / 1024 / 1024}MB for ${validation.type}s`
            };
        }

        // Generate secure filename
        const secureFilename = generateSecureFilename(file.originalname);
        const uploadDir = UPLOAD_DIRS[validation.type === 'image' ? 'images' : 'videos'];
        const tempPath = path.join(uploadDir, 'temp_' + secureFilename);

        // Save file temporarily
        fs.writeFileSync(tempPath, file.buffer);

        let finalPath = tempPath;
        let finalFilename = secureFilename;

        // Optimize images
        if (validation.type === 'image') {
            const optimizedFilename = secureFilename.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
            const optimizedPath = path.join(uploadDir, optimizedFilename);

            const optimization = await optimizeImage(tempPath, optimizedPath);

            if (optimization.success) {
                finalPath = optimizedPath;
                finalFilename = optimizedFilename;
            } else {
                // If optimization fails, keep original
                fs.renameSync(tempPath, path.join(uploadDir, secureFilename));
            }
        } else {
            // For videos, just rename from temp
            fs.renameSync(tempPath, path.join(uploadDir, secureFilename));
        }

        return {
            success: true,
            filename: finalFilename,
            path: `/api/files/${validation.type}/${finalFilename}`,
            size: fs.statSync(finalPath).size,
            mimetype: validation.type === 'image' ? 'image/webp' : validation.mimetype,
            originalName: file.originalname
        };

    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Secure file serving middleware
export function serveSecureFile(req, res) {
    try {
        const { type, filename } = req.params;

        // Validate type
        if (!['images', 'videos', 'documents'].includes(type)) {
            return res.status(400).json({ error: 'Invalid file type' });
        }

        // Sanitize filename to prevent directory traversal
        const sanitizedFilename = path.basename(filename);
        const filePath = path.join(UPLOAD_DIRS[type], sanitizedFilename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Verify file is within allowed directory
        const resolvedPath = path.resolve(filePath);
        const allowedDir = path.resolve(UPLOAD_DIRS[type]);

        if (!resolvedPath.startsWith(allowedDir)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Set appropriate content type
        const ext = path.extname(filename).toLowerCase();
        const contentTypes = {
            '.webp': 'image/webp',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.mp4': 'video/mp4',
            '.mov': 'video/quicktime'
        };

        res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

        // Send file
        res.sendFile(filePath);

    } catch (error) {
        res.status(500).json({ error: 'Error serving file' });
    }
}

export default upload;
