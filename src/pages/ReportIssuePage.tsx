import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, AlertCircle, CheckCircle, Mic, MicOff, Video, X, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { localStorageService, Issue } from '../lib/localStorage';
import { IssueMap } from '../components/IssueMap';

export function ReportIssuePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issueType, setIssueType] = useState('pothole');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  
  // Multiple photos support
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  
  // Video support
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  
  // Voice note support
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string>('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Anonymous reporting
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousEmail, setAnonymousEmail] = useState('');
  
  const [latitude, setLatitude] = useState<number>(40.7128);
  const [longitude, setLongitude] = useState<number>(-74.006);
  const [locationSet, setLocationSet] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // File size validation helper
  const validateFileSize = (file: File, maxSizeMB: number): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  };

  // Calculate total size of photos
  const getTotalPhotosSize = (): number => {
    return photos.reduce((total, photo) => total + photo.size, 0);
  };

  // Multiple photos handling
  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file count
    if (photos.length + files.length > 5) {
      setError('Maximum 5 photos allowed');
      return;
    }

    // Validate file sizes
    const invalidFiles = files.filter(file => !validateFileSize(file, 10));
    if (invalidFiles.length > 0) {
      setError('Each photo must be under 10MB');
      return;
    }

    // Check total size
    const newTotalSize = getTotalPhotosSize() + files.reduce((total, file) => total + file.size, 0);
    if (newTotalSize > 10 * 1024 * 1024) {
      setError('Total photos size cannot exceed 10MB');
      return;
    }

    setError('');
    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Video handling
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateFileSize(file, 10)) {
        setError('Video must be under 10MB');
        return;
      }
      
      setVideo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeVideo = () => {
    setVideo(null);
    setVideoPreview('');
  };

  // Voice note handling
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setVoiceNote(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      setError('Microphone access denied or not available');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const removeVoiceNote = () => {
    setVoiceNote('');
    setRecordingDuration(0);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setLocationSet(true);
  };

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLocationSet(true);
        },
        () => {
          setError('Unable to get your location. Please click on the map to set location.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser. Please click on the map to set location.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!locationSet) {
      setError('Please set a location on the map or use your current location');
      setLoading(false);
      return;
    }

    if (isAnonymous && !anonymousEmail) {
      setError('Please provide an email address for anonymous reporting');
      setLoading(false);
      return;
    }

    try {
      // Upload all files to local server
      const fileUrls: string[] = [];
      
      // Upload photos
      if (photos.length > 0) {
        const photoUrls = await Promise.all(
          photos.map(photo => localStorageService.uploadFile(photo))
        );
        fileUrls.push(...photoUrls);
      }
      
      // Upload video
      if (video) {
        const videoUrl = await localStorageService.uploadFile(video);
        fileUrls.push(videoUrl);
      }
      
      // Upload voice note
      if (voiceNote) {
        const blob = await fetch(voiceNote).then(r => r.blob());
        const file = new File([blob], 'voice-note.wav', { type: 'audio/wav' });
        const voiceNoteUrl = await localStorageService.uploadFile(file);
        fileUrls.push(voiceNoteUrl);
      }

      // Create issue data for backend API
      const issueData: Omit<Issue, 'id' | 'created_at' | 'updated_at'> = {
        user_id: isAnonymous ? 'anonymous' : (user?.email || ''),
        issue_type: issueType as Issue['issue_type'],
        description,
        photo_url: fileUrls?.[0], // Keep first photo for backward compatibility
        photos: fileUrls,
        video_url: fileUrls.find(url => url.includes('video')) || undefined,
        voice_note_url: fileUrls.find(url => url.includes('voice')) || undefined,
        priority,
        latitude,
        longitude,
        status: 'pending' as const,
        is_anonymous: isAnonymous,
        anonymous_email: isAnonymous ? anonymousEmail : undefined,
      };

      // Submit issue to backend API
      const { issue, error: createError } = await localStorageService.createIssue(issueData);

      if (createError) throw createError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/my-complaints');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit issue');
    } finally {
      setLoading(false);
    }
  };

  if (!user && !isAnonymous) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Please log in to report an issue</p>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go to Login
            </button>
            <div className="text-gray-500">or</div>
            <button
              onClick={() => setIsAnonymous(true)}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Report Anonymously
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex-grow">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Report an Issue</h1>
          <p className="text-gray-600">Help improve your city by reporting problems</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3 text-green-700">
            <CheckCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-medium">Issue reported successfully!</p>
              <p className="text-sm">Redirecting to your complaints...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-red-700">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Anonymous Reporting Option */}
            {!user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="anonymous" className="text-sm font-medium text-blue-800">
                    Report anonymously
                  </label>
                </div>
                {isAnonymous && (
                  <div>
                    <label htmlFor="anonymousEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      Email for updates (required for anonymous reports)
                    </label>
                    <input
                      type="email"
                      id="anonymousEmail"
                      value={anonymousEmail}
                      onChange={(e) => setAnonymousEmail(e.target.value)}
                      required={isAnonymous}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Issue Type */}
            <div>
              <label htmlFor="issueType" className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type
              </label>
              <select
                id="issueType"
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pothole">Pothole</option>
                <option value="garbage">Garbage Collection</option>
                <option value="streetlight">Streetlight Failure</option>
                <option value="water_leak">Water Leak</option>
                <option value="broken_sidewalk">Broken Sidewalk</option>
                <option value="traffic_signal">Traffic Signal Issue</option>
                <option value="street_sign">Damaged/Missing Street Sign</option>
                <option value="drainage">Drainage Problem</option>
                <option value="tree_maintenance">Tree Maintenance</option>
                <option value="graffiti">Graffiti/Vandalism</option>
                <option value="noise_complaint">Noise Complaint</option>
                <option value="parking_violation">Parking Violation</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Priority Level */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Issue['priority'])}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low - Minor inconvenience</option>
                <option value="medium">Medium - Moderate impact</option>
                <option value="high">High - Significant impact</option>
                <option value="critical">Critical - Safety hazard</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Please provide details about the issue..."
              />
            </div>

            {/* Multiple Photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos (Optional - Up to 5 photos, max 10MB total)
              </label>
              <div className="flex items-center space-x-4 mb-4">
                <label className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer">
                  <Camera className="w-5 h-5" />
                  <span>Add Photos</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotosChange}
                    className="hidden"
                    disabled={photos.length >= 5}
                  />
                </label>
                <span className="text-sm text-gray-600">
                  {photos.length}/5 photos ({Math.round(getTotalPhotosSize() / 1024 / 1024 * 100) / 100}MB)
                </span>
              </div>
              
              {/* Photo Previews */}
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video (Optional - Max 10MB)
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer">
                  <Video className="w-5 h-5" />
                  <span>Upload Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                </label>
                {video && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{video.name}</span>
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {videoPreview && (
                <video
                  src={videoPreview}
                  controls
                  className="mt-4 max-w-md rounded-lg border-2 border-gray-200"
                />
              )}
            </div>

            {/* Voice Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voice Note (Optional - For accessibility)
              </label>
              <div className="flex items-center space-x-4">
                {!isRecording && !voiceNote && (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                  >
                    <Mic className="w-5 h-5" />
                    <span>Start Recording</span>
                  </button>
                )}
                
                {isRecording && (
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                    >
                      <MicOff className="w-5 h-5" />
                      <span>Stop Recording</span>
                    </button>
                    <span className="text-sm text-gray-600">
                      Recording: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
                
                {voiceNote && !isRecording && (
                  <div className="flex items-center space-x-4">
                    <audio src={voiceNote} controls className="max-w-xs" />
                    <button
                      type="button"
                      onClick={removeVoiceNote}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <MapPin className="w-5 h-5" />
                  <span>Use My Current Location</span>
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  Or click on the map to set the location
                </p>
              </div>
              <IssueMap
                issues={locationSet ? [{
                  id: 'temp',
                  user_id: user?.email || 'anonymous',
                  issue_type: issueType as any,
                  description: 'Selected location',
                  latitude,
                  longitude,
                  status: 'pending',
                  priority: priority,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }] : []}
                center={{ lat: latitude, lng: longitude }}
                onLocationSelect={handleLocationSelect}
                height="400px"
              />
              {locationSet && (
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Location set: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : (isAnonymous ? 'Submit Anonymous Report' : 'Submit Complaint')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
