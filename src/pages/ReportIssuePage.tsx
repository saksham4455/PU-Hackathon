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

      // Map issue type to department (matching department_heads.json IDs)
      const getDepartmentForIssueType = (issueType: string): { id: string; name: string } => {
        const mapping: Record<string, { id: string; name: string }> = {
          'pothole': { id: 'dept-001', name: 'Road Maintenance' },
          'broken_sidewalk': { id: 'dept-001', name: 'Road Maintenance' },
          'garbage': { id: 'dept-002', name: 'Sanitation' },
          'streetlight': { id: 'dept-003', name: 'Electrical Services' },
          'water_leak': { id: 'dept-004', name: 'Water & Sewage' },
          'drainage': { id: 'dept-004', name: 'Water & Sewage' },
          'traffic_signal': { id: 'dept-005', name: 'Traffic Management' },
          'parking_violation': { id: 'dept-005', name: 'Traffic Management' },
          'street_sign': { id: 'dept-006', name: 'Signage & Markings' },
          'tree_maintenance': { id: 'dept-007', name: 'Parks & Horticulture' },
          'graffiti': { id: 'dept-009', name: 'Anti-Vandalism' },
          'noise_complaint': { id: 'dept-008', name: 'Public Safety' },
          'other': { id: 'dept-010', name: 'General Services' }
        };
        return mapping[issueType] || { id: 'dept-010', name: 'General Services' };
      };

      const department = getDepartmentForIssueType(issueType);

      // Create issue data for backend API
      const issueData: Omit<Issue, 'id' | 'created_at' | 'updated_at'> = {
        user_id: isAnonymous ? 'anonymous' : (user?.id || ''),
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
        department_id: department.id,
        department_name: department.name,
      };

      // Submit issue to backend API
      const { error: createError } = await localStorageService.createIssue(issueData);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex-grow py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-blue-600/10 to-purple-600/10 -skew-y-6 transform origin-top-left z-0 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
            Report an <span className="text-gradient">Issue</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Help us maintain our city standards. Your detailed report helps us take faster action.
          </p>
        </div>

        {success && (
          <div className="mb-8 p-6 bg-green-50/90 backdrop-blur-md border border-green-200 rounded-2xl flex items-center space-x-4 text-green-800 shadow-lg animate-fade-in">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Report Submitted Successfully!</h3>
              <p className="text-green-700">redirecting you to your complaints dashboard...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 p-6 bg-red-50/90 backdrop-blur-md border border-red-200 rounded-2xl flex items-center space-x-4 text-red-800 shadow-lg animate-fade-in">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Submission Failed</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="glass-panel rounded-3xl p-8 md:p-10 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Anonymous Reporting Option */}
            {!user && (
              <div className="bg-blue-50/50 backdrop-blur-sm border border-blue-100 rounded-2xl p-6 transition-all duration-300 hover:bg-blue-50">
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="anonymous" className="text-lg font-medium text-gray-900 cursor-pointer">
                    Report anonymously
                  </label>
                </div>
                {isAnonymous && (
                  <div className="animate-fade-in pl-8">
                    <label htmlFor="anonymousEmail" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email for updates <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="anonymousEmail"
                      value={anonymousEmail}
                      onChange={(e) => setAnonymousEmail(e.target.value)}
                      required={isAnonymous}
                      className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="your.email@example.com"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Issue Type */}
              <div className="space-y-2">
                <label htmlFor="issueType" className="block text-sm font-semibold text-gray-700">
                  Issue Type
                </label>
                <div className="relative">
                  <select
                    id="issueType"
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all hover:bg-white"
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
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Priority Level */}
              <div className="space-y-2">
                <label htmlFor="priority" className="block text-sm font-semibold text-gray-700">
                  Priority Level
                </label>
                <div className="relative">
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Issue['priority'])}
                    className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all hover:bg-white"
                  >
                    <option value="low">Low - Minor inconvenience</option>
                    <option value="medium">Medium - Moderate impact</option>
                    <option value="high">High - Significant impact</option>
                    <option value="critical">Critical - Safety hazard</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-white resize-none"
                placeholder="Please describe the issue in detail. Mention specific landmarks if possible..."
              />
            </div>

            {/* Media Upload Section */}
            <div className="space-y-6 pt-4 border-t border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Media Evidence</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Photos */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Photos (Max 5)
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group bg-white/50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Camera className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mb-2 transition-colors" />
                      <p className="text-sm text-gray-500 group-hover:text-blue-600 font-medium">Add Photos</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotosChange}
                      className="hidden"
                      disabled={photos.length >= 5}
                    />
                  </label>
                  <p className="text-xs text-center text-gray-500">
                    {photos.length}/5 uploaded ({Math.round(getTotalPhotosSize() / 1024 / 1024 * 100) / 100}MB)
                  </p>
                </div>

                {/* Video */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Video (Optional)
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50/50 transition-all cursor-pointer group bg-white/50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Video className="w-8 h-8 text-gray-400 group-hover:text-purple-500 mb-2 transition-colors" />
                      <p className="text-sm text-gray-500 group-hover:text-purple-600 font-medium">Upload Video</p>
                    </div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Voice Note */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Voice Note
                  </label>
                  {!isRecording && !voiceNote ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl hover:border-red-500 hover:bg-red-50/50 transition-all group bg-white/50"
                    >
                      <Mic className="w-8 h-8 text-gray-400 group-hover:text-red-500 mb-2 transition-colors" />
                      <p className="text-sm text-gray-500 group-hover:text-red-600 font-medium">Record Audio</p>
                    </button>
                  ) : isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-red-500 bg-red-50 rounded-xl animate-pulse"
                    >
                      <MicOff className="w-8 h-8 text-red-600 mb-2" />
                      <p className="text-sm text-red-700 font-bold">Stop Recording</p>
                      <p className="text-xs text-red-600 mt-1">
                        {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                      </p>
                    </button>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-green-500 bg-green-50 rounded-xl relative">
                      <audio src={voiceNote} controls className="w-11/12 h-8 mb-2 opacity-80" />
                      <button
                        type="button"
                        onClick={removeVoiceNote}
                        className="text-xs text-red-600 hover:underline font-semibold"
                      >
                        Remove Recording
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Previews */}
              {(photoPreviews.length > 0 || videoPreview) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden shadow-md h-24">
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-8 h-8 text-white bg-red-500/80 rounded-full p-1" />
                      </button>
                    </div>
                  ))}
                  {videoPreview && (
                    <div className="relative group rounded-xl overflow-hidden shadow-md h-24 bg-black">
                      <video src={videoPreview} className="w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={removeVideo}
                          className="bg-red-500/80 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Location */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Location</h3>
                <p className="text-sm text-gray-600 mb-4">Click on the map or use your current location to pinpoint the issue.</p>
              </div>

              <div className="rounded-2xl overflow-hidden border-2 border-gray-200 shadow-inner relative">
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

                {/* Map Controls Overlay */}
                <div className="absolute top-4 right-4 z-[999]">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:bg-gray-50 transition-all border border-gray-100"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>My Location</span>
                  </button>
                </div>
              </div>

              {locationSet ? (
                <div className="flex items-center text-green-700 bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Location coordinates set: {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                </div>
              ) : (
                <div className="flex items-center text-amber-700 bg-amber-50 px-4 py-3 rounded-lg border border-amber-200">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span className="font-medium">Please select a location on the map</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                    Submitting Report...
                  </span>
                ) : (
                  isAnonymous ? 'Submit Anonymous Report' : 'Submit Complaint'
                )}
              </button>
              <p className="text-center text-gray-500 text-sm mt-4">
                By submitting, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
