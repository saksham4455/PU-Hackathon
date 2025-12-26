import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Camera, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { localStorageService, Issue } from '../lib/localStorage';

export function DepartmentWorkerIssueDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [issue, setIssue] = useState<Issue | null>(null);
    const [loading, setLoading] = useState(true);
    const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
    const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
    const [workNotes, setWorkNotes] = useState('');
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'department_worker') {
            navigate('/login');
            return;
        }
        loadIssue();
    }, [user, navigate, id]);

    const loadIssue = async () => {
        if (!id) return;
        try {
            const { issue: issueData } = await localStorageService.getIssueById(id);
            if (issueData) {
                setIssue(issueData);
                setBeforePhotos(issueData.before_photos || []);
                setAfterPhotos(issueData.after_photos || []);
                setWorkNotes(issueData.work_notes || '');
            }
        } catch (error) {
            console.error('Error loading issue:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
        const files = e.target.files;
        if (!files) return;

        // In a real app, this would upload to a server
        // For demo, we'll create data URLs
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                if (type === 'before') {
                    setBeforePhotos(prev => [...prev, dataUrl]);
                } else {
                    setAfterPhotos(prev => [...prev, dataUrl]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async () => {
        if (!issue || !id) return;

        setUploading(true);
        try {
            // Update issue with photos and notes
            const updatedIssue = {
                ...issue,
                before_photos: beforePhotos,
                after_photos: afterPhotos,
                solution_photos: [...beforePhotos, ...afterPhotos],
                work_notes: workNotes,
                work_completed_at: new Date().toISOString(),
                status: 'resolved' as const
            };

            setIssue(updatedIssue);
            setSuccess(true);

            setTimeout(() => {
                navigate('/worker/dashboard');
            }, 2000);
        } catch (error) {
            console.error('Error submitting work:', error);
        } finally {
            setUploading(false);
        }
    };

    if (!user || user.role !== 'department_worker') {
        return null;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
    }

    if (!issue) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-600 mb-4">Issue not found</p>
                    <button
                        onClick={() => navigate('/worker/dashboard')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const canSubmit = beforePhotos.length > 0 && afterPhotos.length > 0 && workNotes.trim().length > 0;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <button
                    onClick={() => navigate('/worker/dashboard')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Dashboard</span>
                </button>

                {/* Success Message */}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800">
                        <CheckCircle2 className="w-6 h-6" />
                        <span className="font-medium">Work submitted successfully! Redirecting...</span>
                    </div>
                )}

                {/* Issue Info */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 capitalize mb-2">
                        {issue.issue_type.replace('_', ' ')}
                    </h1>
                    <p className="text-gray-600 mb-4">{issue.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>📍 {issue.location_address || 'Location not specified'}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${issue.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                issue.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                    issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                            }`}>
                            {issue.priority} priority
                        </span>
                    </div>
                </div>

                {/* Original Photos */}
                {issue.photos && issue.photos.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Original Report Photos</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {issue.photos.map((photo, index) => (
                                <img
                                    key={index}
                                    src={photo}
                                    alt={`Original ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Before Photos Upload */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Before Photos</h2>
                        <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-2">
                            <Camera className="w-4 h-4" />
                            <span>Add Photos</span>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, 'before')}
                                disabled={issue.work_completed_at !== undefined}
                            />
                        </label>
                    </div>
                    {beforePhotos.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                            <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                            <p>Upload photos showing the issue before you start work</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {beforePhotos.map((photo, index) => (
                                <div key={index} className="relative">
                                    <img
                                        src={photo}
                                        alt={`Before ${index + 1}`}
                                        className="w-full h-32 object-cover rounded-lg"
                                    />
                                    {!issue.work_completed_at && (
                                        <button
                                            onClick={() => setBeforePhotos(prev => prev.filter((_, i) => i !== index))}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* After Photos Upload */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">After Photos</h2>
                        <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer flex items-center gap-2">
                            <Camera className="w-4 h-4" />
                            <span>Add Photos</span>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, 'after')}
                                disabled={issue.work_completed_at !== undefined}
                            />
                        </label>
                    </div>
                    {afterPhotos.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                            <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                            <p>Upload photos showing the completed work</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {afterPhotos.map((photo, index) => (
                                <div key={index} className="relative">
                                    <img
                                        src={photo}
                                        alt={`After ${index + 1}`}
                                        className="w-full h-32 object-cover rounded-lg"
                                    />
                                    {!issue.work_completed_at && (
                                        <button
                                            onClick={() => setAfterPhotos(prev => prev.filter((_, i) => i !== index))}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Work Notes */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Notes</h2>
                    <textarea
                        value={workNotes}
                        onChange={(e) => setWorkNotes(e.target.value)}
                        placeholder="Describe the work performed, materials used, and any observations..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={5}
                        disabled={issue.work_completed_at !== undefined}
                    />
                </div>

                {/* Submit Button */}
                {!issue.work_completed_at && (
                    <div className="bg-white rounded-lg shadow p-6">
                        {!canSubmit && (
                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-800 text-sm">
                                <AlertCircle className="w-5 h-5" />
                                <span>Please upload before & after photos and add work notes to submit</span>
                            </div>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit || uploading}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {uploading ? 'Submitting...' : 'Submit Completed Work'}
                        </button>
                    </div>
                )}

                {issue.work_completed_at && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-green-900 mb-2">Work Completed</h3>
                        <p className="text-green-700">
                            Submitted on {new Date(issue.work_completed_at).toLocaleString()}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
