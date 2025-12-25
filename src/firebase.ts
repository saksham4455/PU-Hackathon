import usersData from './data/users.json';
import adminsData from './data/admins.json';

// In-memory storage for complaints and uploaded files
const complaints: any[] = [];
let fileCounter = 0;

// File upload function - simulates file storage
export const uploadFile = async (file: File) => {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    fileCounter++;
    // In a real app, we would save the file to disk
    // For now, just return a fake URL
    return `http://localhost:3000/uploads/${fileName}`;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Submit complaint function
export const submitComplaint = async (complaint: {
  userId: string;
  type: string;
  description: string;
  location: string;
  files: string[];
}) => {
  try {
    const newComplaint = {
      id: `complaint_${Date.now()}`,
      ...complaint,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    complaints.push(newComplaint);
    return newComplaint.id;
  } catch (error) {
    console.error("Error submitting complaint:", error);
    throw error;
  }
};

// Get user complaints
export const getUserComplaints = async (userId: string) => {
  try {
    return complaints
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error getting complaints:", error);
    throw error;
  }
};

// Get all complaints (for admin)
export const getAllComplaints = async () => {
  try {
    return complaints.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("Error getting all complaints:", error);
    throw error;
  }
};

// Local Authentication functions
export const loginUser = async (email: string, password: string) => {
  try {
    // Check admin credentials first
    const admin = adminsData.admins.find(a => a.email === email && a.password === password);
    if (admin) {
      return {
        uid: admin.id,
        email: admin.email,
        displayName: admin.full_name,
        role: admin.role
      };
    }

    // Check user credentials
    const user = usersData.users.find(u => u.email === email && u.password === password);
    if (user) {
      return {
        uid: user.id,
        email: user.email,
        displayName: user.full_name,
        role: user.role
      };
    }

    throw new Error('Invalid email or password');
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const registerUser = async (email: string, password: string) => {
  try {
    // Check if user already exists
    const existingUser = usersData.users.find(u => u.email === email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create new user
    const newUser = {
      id: `user_${Date.now()}`,
      email,
      password,
      role: 'citizen',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // In a real app, we would save to the JSON file here
    // For now, we'll just return the user object
    return {
      uid: newUser.id,
      email: newUser.email,
      displayName: '',
      role: newUser.role
    };
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

export { app, db, auth, storage };