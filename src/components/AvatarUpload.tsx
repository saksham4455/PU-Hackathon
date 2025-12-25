import { useState } from 'react';
import { Camera } from 'lucide-react';

interface AvatarUploadProps {
    currentAvatar?: string;
    userName: string;
    onAvatarChange: (avatarUrl: string) => void;
}

export default function AvatarUpload({ currentAvatar, userName, onAvatarChange }: AvatarUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | undefined>(currentAvatar);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Image size should be less than 2MB');
            return;
        }

        try {
            setUploading(true);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Upload to server
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch('http://localhost:3001/api/upload/avatar', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            onAvatarChange(data.fileUrl);
        } catch (error) {
            console.error('Avatar upload error:', error);
            alert('Failed to upload avatar. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    // Get initials for default avatar
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="flex flex-col items-center">
            <div className="relative group">
                {/* Avatar Display */}
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center shadow-xl">
                    {preview ? (
                        <img
                            src={preview}
                            alt={userName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-4xl font-bold text-white">
                            {getInitials(userName)}
                        </span>
                    )}
                </div>

                {/* Upload Overlay */}
                <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                    <div className="text-center text-white">
                        <Camera className="w-8 h-8 mx-auto mb-1" />
                        <span className="text-xs font-medium">
                            {uploading ? 'Uploading...' : 'Change'}
                        </span>
                    </div>
                </label>

                <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                />
            </div>

            <p className="text-sm text-gray-500 mt-3 text-center">
                Click to upload avatar<br />
                (Max 2MB, JPG/PNG)
            </p>
        </div>
    );
}
