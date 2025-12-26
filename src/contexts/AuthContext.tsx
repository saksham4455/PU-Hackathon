import { createContext, useContext, useEffect, useState } from 'react';
import { Profile } from '../lib/localStorage';
import usersData from '../data/users.json';
import adminsData from '../data/admins.json';
import departmentHeadsData from '../data/department_heads.json';
import departmentWorkersData from '../data/department_workers.json';

type UserRole = 'citizen' | 'super_admin' | 'department_head' | 'department_worker';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  department_id?: string;
  department_name?: string;
  worker_id?: string;
  specialization?: string;
}

// Type guard to check if a user has a valid role type
function isValidRole(role: string): role is UserRole {
  return ['citizen', 'super_admin', 'department_head', 'department_worker'].includes(role);
}

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string, role?: UserRole) => Promise<{ error: Error | null }>;
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
        full_name: fullName,
        role: 'citizen' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store user in local storage (without password)
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      setUser(newUser);
      setProfile(newUser);

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string, requestedRole?: UserRole) => {
    try {
      let foundUser: any = null;
      let userRole: UserRole | null = null;

      // Check based on requested role or search all
      if (!requestedRole || requestedRole === 'super_admin') {
        const admin = adminsData.admins.find(a => a.email === email && a.password === password);
        if (admin && isValidRole(admin.role)) {
          foundUser = admin;
          userRole = admin.role as UserRole;
        }
      }

      if (!foundUser && (!requestedRole || requestedRole === 'department_head')) {
        const head = departmentHeadsData.department_heads.find(h => h.email === email && h.password === password);
        if (head && isValidRole(head.role)) {
          foundUser = head;
          userRole = head.role as UserRole;
        }
      }

      if (!foundUser && (!requestedRole || requestedRole === 'department_worker')) {
        const worker = departmentWorkersData.department_workers.find(w => w.email === email && w.password === password);
        if (worker && isValidRole(worker.role)) {
          foundUser = worker;
          userRole = worker.role as UserRole;
        }
      }

      if (!foundUser && (!requestedRole || requestedRole === 'citizen')) {
        const citizen = usersData.users.find(u => u.email === email && u.password === password);
        if (citizen && isValidRole(citizen.role)) {
          foundUser = citizen;
          userRole = citizen.role as UserRole;
        }
      }

      if (!foundUser || !userRole) {
        throw new Error('Invalid email or password');
      }

      // If a specific role was requested, verify it matches
      if (requestedRole && userRole !== requestedRole) {
        throw new Error(`Invalid credentials for ${requestedRole} role`);
      }

      // Create user object without password
      const { password: _, ...userWithoutPassword } = foundUser;
      const validUser = { ...userWithoutPassword, role: userRole };

      localStorage.setItem('currentUser', JSON.stringify(validUser));
      setUser(validUser);
      setProfile(validUser);
      return { error: null };
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
