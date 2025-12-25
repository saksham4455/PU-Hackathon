import { createContext, useContext, useEffect, useState } from 'react';
import { Profile } from '../lib/localStorage';
import usersData from '../data/users.json';
import adminsData from '../data/admins.json';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'citizen' | 'admin';
  created_at: string;
  updated_at: string;
  password: string;
}

// Type guard to check if a user has the correct role type
function isValidRole(role: string): role is 'citizen' | 'admin' {
  return role === 'citizen' || role === 'admin';
}

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is stored in local storage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setProfile(parsedUser);
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
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
        full_name: fullName,
        role: 'citizen' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store user in local storage
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      setUser(newUser);
      setProfile(newUser);

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Check admin credentials
      const admin = adminsData.admins.find(a => a.email === email && a.password === password);
      if (admin && isValidRole(admin.role)) {
        const validAdmin = { ...admin, role: admin.role };
        localStorage.setItem('currentUser', JSON.stringify(validAdmin));
        setUser(validAdmin);
        setProfile(validAdmin);
        return { error: null };
      }

      // Check user credentials
      const user = usersData.users.find(u => u.email === email && u.password === password);
      if (user && isValidRole(user.role)) {
        const validUser = { ...user, role: user.role };
        localStorage.setItem('currentUser', JSON.stringify(validUser));
        setUser(validUser);
        setProfile(validUser);
        return { error: null };
      }

      throw new Error('Invalid email or password');
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as Error };
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('currentUser');
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
