# City Issue Reporting System

A comprehensive React-based web application that empowers citizens to report city issues and enables administrators to efficiently manage and resolve them.

## 🚀 Features

### For Citizens
- **User Authentication**: Secure registration and login system for citizens
- **Issue Reporting**: Report city issues with comprehensive details
  - **12+ Issue Types**: Potholes, garbage, streetlights, water leaks, broken sidewalks, traffic signals, street signs, drainage, tree maintenance, graffiti, noise complaints, parking violations, and more
  - **Rich Media Support**: Upload up to 5 photos, videos, or voice notes
  - **Location Selection**: Interactive map-based location picker with GPS support
  - **Priority Levels**: Set issue priority (low, medium, high, critical)
  - **Anonymous Reporting**: Option to report issues anonymously
- **Track Your Issues**: View all reported issues with status updates and admin comments
- **Status History**: Complete timeline of issue status changes
- **Public Comments**: See updates and responses from administrators

### For Administrators
- **Admin Dashboard**: Comprehensive dashboard with issue management
- **Advanced Filtering**: Filter issues by status, type, priority, date range, and search
- **Status Management**: Update issue status with detailed admin notes
- **Public Comments**: Add public comments visible to citizens
- **Analytics**: View statistics, resolution rates, and performance metrics
- **Export Options**: Export data to JSON, CSV, or PDF formats
- **Issue Tracking**: View detailed status history and timestamps

### Additional Features
- **Interactive Map**: Visual representation of all reported issues
- **Responsive Design**: Fully responsive UI optimized for all devices
- **Real-time Updates**: Track issue status changes in real-time
- **File Uploads**: Support for photos, videos, and audio files
- **Background Server**: Local Express server for file handling
- **🆕 Enhanced File Security**: Magic number validation, secure filenames, image optimization

## 🛠️ Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Charts**: Chart.js & React-ChartJS-2
- **Backend**: Express.js (for file uploads)
- **State Management**: React Context API
- **Security**: file-type, sharp (image optimization), uuid

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd masaihackathon-test1-master
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the Express server** (for file uploads)
   ```bash
   npm run server
   ```

4. **Start the development server** (in a new terminal)
   ```bash
   npm run dev
   ```

   Or run both simultaneously:
   ```bash
   npm run dev:full
   ```

5. **Open your browser**
   - Navigate to the URL provided by Vite (typically `http://localhost:5173`)

## 🔐 Default Credentials

### Admin Account
- **Email**: `admin@city.gov`
- **Password**: `admin123`
- **Role**: Administrator

### Test User (Pre-configured)
- Multiple test users are available in the system
- Check `src/data/users.json` for available test accounts

## 📁 Project Structure

```
src/
├── components/          # Reusable React components
│   ├── Navbar.tsx      # Main navigation component
│   ├── Footer.tsx      # Footer component
│   ├── IssueMap.tsx    # Interactive map component
│   └── Modal.tsx       # Modal dialogs
├── contexts/           # React context providers
│   └── AuthContext.tsx # Authentication context
├── lib/                # Utility functions
│   └── localStorage.ts # Backend API service
├── pages/              # Main application pages
│   ├── AdminDashboard.tsx
│   ├── AdminLoginPage.tsx
│   ├── AdminIssueDetail.tsx
│   ├── AdminActionPanel.tsx
│   ├── AnalyticsPage.tsx
│   ├── LoginPage.tsx
│   ├── MyComplaintsPage.tsx
│   ├── PublicDashboard.tsx
│   ├── ReportIssuePage.tsx
│   └── UserProfilePage.tsx
└── data/              # JSON data files
    ├── users.json      # User accounts
    ├── admins.json     # Admin accounts
    └── issues.json     # Reported issues
```

## 🗄️ Data Storage

The application uses a hybrid storage approach:

- **JSON Files**: Initial data structure and seed data
  - `src/data/users.json` - User accounts
  - `src/data/admins.json` - Admin accounts
  - `src/data/issues.json` - Reported issues

- **localStorage**: Runtime data persistence in the browser
- **File System**: Uploaded files stored in `uploads/` directory
- **Express Server**: Handles file uploads and API requests

All data persists between browser sessions.

## 🎯 Available Issue Types

- Pothole
- Garbage Collection
- Streetlight Failure
- Water Leak
- Broken Sidewalk
- Traffic Signal Issue
- Damaged/Missing Street Sign
- Drainage Problem
- Tree Maintenance
- Graffiti/Vandalism
- Noise Complaint
- Parking Violation
- Other

## 📊 Issue Status Flow

1. **Pending**: Newly reported issue awaiting review
2. **In Progress**: Issue is being addressed by city staff
3. **Resolved**: Issue has been fixed and verified

## 🎨 Key Pages

- **Home** (`/home`): Public dashboard with statistics and issue overview
- **Report Issue** (`/report`): Citizen issue reporting form
- **My Complaints** (`/my-complaints`): View all user's reported issues
- **Admin Dashboard** (`/admin`): Administrator issue management interface
- **Admin Login** (`/admin-login`): Admin authentication
- **Analytics** (`/admin/analytics`): Statistical reports and metrics
- **Profile** (`/profile`): User profile management

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run server` - Start Express backend server
- `npm run dev:full` - Run both frontend and backend concurrently
- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript type checking

## 📝 API Endpoints

The backend Express server provides the following endpoints:

- `POST /api/users` - Create new user
- `GET /api/users` - Get all users
- `PUT /api/users/:id` - Update user
- `POST /api/auth/login` - User authentication
- `POST /api/issues` - Create new issue
- `GET /api/issues` - Get all issues
- `GET /api/issues/:id` - Get specific issue
- `PUT /api/issues/:id/status` - Update issue status
- `POST /api/upload` - Upload files

## 🌟 Key Features Breakdown

### Media Support
- **Photos**: Up to 5 photos per issue (max 10MB each)
- **Videos**: Single video per issue (max 10MB)
- **Voice Notes**: Audio recording for accessibility

### Location Features
- Click on map to select location
- Use current GPS location
- View all issues on interactive map

### Admin Capabilities
- Filter issues by multiple criteria
- Search across all fields
- Update status with comments
- Add public-facing updates
- Export data in multiple formats
- View detailed analytics

## 🔒 Security Features

### Enhanced File Upload Security
- **Magic Number Validation**: Detects actual file types from content (prevents fake extensions)
- **Secure UUID Filenames**: Random, unpredictable filenames prevent enumeration attacks  
- **Path Traversal Protection**: Blocks `../` and directory traversal attempts
- **Image Optimization**: Auto-resize to 2048x2048, WebP conversion, EXIF metadata stripping
- **File Size Limits**: 10MB for images, 50MB for videos
- **Secure Storage**: Files stored in protected directories with controlled access

See [`docs/FILE_UPLOAD_SECURITY_IMPLEMENTATION.md`](docs/FILE_UPLOAD_SECURITY_IMPLEMENTATION.md) for details.

## 📚 Documentation

- **[Project Improvements](PROJECT_IMPROVEMENTS_AND_FUTURE_FEATURES.md)** - Roadmap and future features
- **[File Upload Security](docs/FILE_UPLOAD_SECURITY_IMPLEMENTATION.md)** - Security implementation details
- **[Test Results](docs/TEST_RESULTS_AND_BUG_FIXES.md)** - Testing and bug fixes

## 🤝 Contributing

This is a hackathon project demonstrating a complete city issue reporting system. Feel free to fork and extend with additional features!

## 📄 License

This project is open source and available for educational purposes.

## 👥 Credits

Built with ❤️ for the Masai Hackathon



Video link - https://drive.google.com/file/d/126y5I9fjQw8gyv2Ix3T3I0SoJIMM9Zv5/view?usp=sharing
