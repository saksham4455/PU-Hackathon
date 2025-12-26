import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, User, Users, Wrench } from 'lucide-react';

type UserRole = 'citizen' | 'super_admin' | 'department_head' | 'department_worker';

export function UnifiedLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { signIn } = useAuth();

    const roles = [
        {
            value: 'citizen' as UserRole,
            label: 'Citizen',
            icon: User,
            description: 'Report and track issues',
            color: 'blue'
        },
        {
            value: 'super_admin' as UserRole,
            label: 'Police HQ / Super Admin',
            icon: Shield,
            description: 'Manage all departments',
            color: 'red'
        },
        {
            value: 'department_head' as UserRole,
            label: 'Department Head',
            icon: Users,
            description: 'Manage department workers',
            color: 'orange'
        },
        {
            value: 'department_worker' as UserRole,
            label: 'Department Worker',
            icon: Wrench,
            description: 'Resolve assigned issues',
            color: 'green'
        }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error: signInError } = await signIn(email, password, selectedRole);

            if (signInError) {
                setError(signInError.message);
                setLoading(false);
                return;
            }

            // Navigate based on role
            switch (selectedRole) {
                case 'citizen':
                    navigate('/');
                    break;
                case 'super_admin':
                    navigate('/admin/dashboard');
                    break;
                case 'department_head':
                    navigate('/dept-head/dashboard');
                    break;
                case 'department_worker':
                    navigate('/worker/dashboard');
                    break;
            }
        } catch (err) {
            setError('An error occurred during login');
            setLoading(false);
        }
    };

    const getColorClasses = (color: string) => {
        const colors = {
            blue: 'border-blue-500 bg-blue-50 text-blue-700',
            red: 'border-red-500 bg-red-50 text-red-700',
            orange: 'border-orange-500 bg-orange-50 text-orange-700',
            green: 'border-green-500 bg-green-50 text-green-700'
        };
        return colors[color as keyof typeof colors] || colors.blue;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            City Issue Reporter
                        </h1>
                        <p className="text-gray-600">Sign in to continue</p>
                    </div>

                    {/* Role Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Your Role
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {roles.map((role) => {
                                const Icon = role.icon;
                                const isSelected = selectedRole === role.value;
                                return (
                                    <button
                                        key={role.value}
                                        type="button"
                                        onClick={() => setSelectedRole(role.value)}
                                        className={`p-4 rounded-lg border-2 transition-all ${isSelected
                                                ? getColorClasses(role.color)
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                    >
                                        <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? '' : 'text-gray-400'}`} />
                                        <div className={`text-sm font-medium ${isSelected ? '' : 'text-gray-700'}`}>
                                            {role.label}
                                        </div>
                                        <div className={`text-xs mt-1 ${isSelected ? 'opacity-90' : 'text-gray-500'}`}>
                                            {role.description}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your password"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-700 mb-2">Demo Credentials:</p>
                        <div className="space-y-1 text-xs text-gray-600">
                            <p><strong>Citizen:</strong> test@example.com / test123</p>
                            <p><strong>Super Admin:</strong> admin@city.gov / admin123</p>
                            <p><strong>Dept Head:</strong> road.head@city.gov / road123</p>
                            <p><strong>Worker:</strong> road.worker1@city.gov / worker123</p>
                        </div>
                    </div>

                    {/* Sign Up Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/signup')}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Sign up as Citizen
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
