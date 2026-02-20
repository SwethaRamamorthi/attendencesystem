'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CheckCircle, AlertCircle, Loader2, Upload, X, ImagePlus, ChevronDown, Lock, Eye, EyeOff } from 'lucide-react';

export default function RegisterFaceModule() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedImages, setCapturedImages] = useState<string[]>([]);
    const [uploadMode, setUploadMode] = useState<'webcam' | 'upload'>('webcam');
    const [formData, setFormData] = useState({
        studentName: '',
        studentId: '',
        department: '',
        year: '',
        division: '',
        semester: '',
        email: '',
        phoneNumber: '',
        loginPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // ── Camera selection ────────────────────────────────────
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string>('');

    const enumerateCameras = useCallback(async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true }).then(s => s.getTracks().forEach(t => t.stop()));
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            setCameras(videoDevices);
            if (videoDevices.length > 0 && !selectedCamera) {
                setSelectedCamera(videoDevices[0].deviceId);
            }
        } catch { /* permission denied — fall back to default */ }
    }, [selectedCamera]);

    useEffect(() => { enumerateCameras(); }, []);
    // ────────────────────────────────────────────────────────

    useEffect(() => {
        if (isCapturing && capturedImages.length < 5 && uploadMode === 'webcam') {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isCapturing, capturedImages.length, uploadMode]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 640,
                    height: 480,
                    ...(selectedCamera ? { deviceId: { exact: selectedCamera } } : {}),
                },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();

                detectionIntervalRef.current = setInterval(() => {
                    checkFaceDetection();
                }, 500);
            }
        } catch (err) {
            setError('Failed to access camera. Please grant camera permissions.');
            setIsCapturing(false);
        }
    };

    const stopCamera = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
        }

        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const checkFaceDetection = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg', 0.8);

        try {
            const response = await fetch('http://localhost:5000/api/demo/recognize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData }),
            });

            const data = await response.json();
            setFaceDetected(data.success && data.faces.length > 0);
        } catch (err) {
            console.error('Face detection check error:', err);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current || capturedImages.length >= 5) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImages([...capturedImages, imageData]);

        if (capturedImages.length + 1 >= 5) {
            setIsCapturing(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setError('');
        const remainingSlots = 5 - capturedImages.length;
        const filesToProcess = Array.from(files).slice(0, remainingSlots);

        filesToProcess.forEach((file) => {
            // Check file type
            if (!file.type.match('image/(jpeg|jpg|png)')) {
                setError('Only JPEG, JPG, and PNG files are supported');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setCapturedImages((prev) => [...prev, event.target!.result as string]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setCapturedImages(capturedImages.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (capturedImages.length !== 5) {
            setError('Please capture/upload exactly 5 photos');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/register-student', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Type': 'admin',   // Admin-only route
                },
                body: JSON.stringify({
                    ...formData,
                    images: capturedImages,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setCapturedImages([]);
                setFormData({
                    studentName: '',
                    studentId: '',
                    department: '',
                    year: '',
                    division: '',
                    semester: '',
                    email: '',
                    phoneNumber: '',
                    loginPassword: '',
                });
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('Failed to register student. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Student Registration</h1>
                    <p className="text-slate-500 mt-1 font-medium">Register student details and face data</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50/50 rounded-xl border border-indigo-100/50 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Enrolled Securely</span>
                </div>
            </div>

            {error && (
                <div className="glass-card border-red-200 bg-red-50/30 p-5 text-red-600 flex items-center gap-4 animate-in slide-in-from-top-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shadow-inner">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="font-bold uppercase tracking-wide text-xs">Error</p>
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                </div>
            )}

            {success && (
                <div className="glass-card border-green-200 bg-green-50/30 p-8 text-center animate-in zoom-in-95">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 shadow-glossy border-4 border-white">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Registration Complete</h3>
                    <p className="text-slate-500 font-medium">The student has been successfully registered.</p>
                    <button
                        onClick={() => setSuccess(false)}
                        className="mt-8 px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-black text-sm uppercase tracking-wide shadow-lg hover:scale-105 transition-transform"
                    >
                        Register Another Student
                    </button>
                </div>
            )}

            {!success && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Capture Apparatus */}
                    <div className="lg:col-span-12 xl:col-span-5 space-y-8">
                        <div className="glass-card p-8 border-blue-100/30">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Live Camera</h2>
                                    <p className="text-xs uppercase font-bold tracking-wide text-slate-400 mt-1">Photos Captured: {capturedImages.length}/5</p>
                                </div>
                                <div className="flex p-1.5 glass-nav bg-slate-100/50 rounded-2xl shadow-inner border-slate-200/50">
                                    <button
                                        onClick={() => { setUploadMode('webcam'); setIsCapturing(false); }}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${uploadMode === 'webcam' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
                                    >
                                        <Camera className="w-3.5 h-3.5" />
                                        Camera
                                    </button>
                                    <button
                                        onClick={() => { setUploadMode('upload'); setIsCapturing(false); }}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${uploadMode === 'upload' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
                                    >
                                        <Upload className="w-3.5 h-3.5" />
                                        Upload
                                    </button>
                                </div>
                            </div>

                            <div className="relative glass-card p-1.5 border-slate-200 bg-slate-50/50 overflow-hidden mb-8 group">
                                <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-950 shadow-inner">
                                    <video ref={videoRef} className="w-full h-full object-contain mix-blend-screen" playsInline muted />
                                    <canvas ref={canvasRef} className="hidden" />

                                    {!isCapturing && capturedImages.length < 5 && uploadMode === 'webcam' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                                            <div className="text-center group-hover:scale-110 transition-transform duration-500">
                                                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700 shadow-glossy">
                                                    <Camera className="w-8 h-8 text-slate-500" />
                                                </div>
                                                <p className="text-slate-300 font-bold uppercase tracking-wide text-xs">Ready to Capture</p>
                                            </div>
                                        </div>
                                    )}

                                    {isCapturing && (
                                        <div className="absolute top-6 right-6">
                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wide shadow-glossy border ${faceDetected ? 'bg-green-600/90 text-white border-green-500/50' : 'bg-orange-500/90 text-white border-orange-400/50 animate-pulse'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${faceDetected ? 'bg-white' : 'bg-white'}`}></div>
                                                {faceDetected ? 'Face Detected' : 'Looking for Face'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {uploadMode === 'webcam' ? (
                                <div className="space-y-3">
                                    {/* Camera selector — shown before capturing starts */}
                                    {!isCapturing && cameras.length > 0 && capturedImages.length < 5 && (
                                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                            <Camera className="w-4 h-4 text-slate-400 shrink-0" />
                                            <div className="relative flex-1">
                                                <select
                                                    value={selectedCamera}
                                                    onChange={(e) => setSelectedCamera(e.target.value)}
                                                    className="w-full appearance-none bg-transparent text-xs font-semibold text-slate-700 pr-6 focus:outline-none cursor-pointer"
                                                >
                                                    {cameras.map((cam, i) => (
                                                        <option key={cam.deviceId} value={cam.deviceId}>
                                                            {cam.label || `Camera ${i + 1}`}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    )}
                                    {capturedImages.length < 5 && (
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setIsCapturing(!isCapturing)}
                                                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-wide border transition-all ${isCapturing ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'}`}
                                            >
                                                {isCapturing ? <>Stop Camera</> : <>Start Camera</>}
                                            </button>
                                            <button
                                                onClick={capturePhoto}
                                                className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-black text-xs uppercase tracking-wide shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                                            >
                                                Take Photo
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                capturedImages.length < 5 && (
                                    <div className="relative group">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png"
                                            multiple
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full p-10 glass-card border-dashed border-2 bg-slate-50/50 border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center group"
                                        >
                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform text-slate-400 group-hover:text-blue-500">
                                                <ImagePlus className="w-7 h-7" />
                                            </div>
                                            <p className="font-bold text-xs uppercase tracking-wide text-slate-700">Upload Photos</p>
                                            <p className="text-xs text-slate-400 font-medium mt-1">Supports JPEG/PNG • Select multiple files</p>
                                        </button>
                                    </div>
                                )
                            )}

                            {/* Vault Storage Preview */}
                            {capturedImages.length > 0 && (
                                <div className="mt-10 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 flex items-center gap-2">
                                            Captured Photos
                                            <span className="w-px h-3 bg-slate-300"></span>
                                            <span className="text-blue-600 font-mono italic">{capturedImages.length}/5 Photos</span>
                                        </h3>
                                        <button onClick={() => setCapturedImages([])} className="text-xs font-bold uppercase tracking-wide text-red-400 hover:text-red-600 transition-colors">Clear All</button>
                                    </div>
                                    <div className="grid grid-cols-5 gap-3">
                                        {capturedImages.map((img, index) => (
                                            <div key={index} className="relative aspect-square glass-card p-1 group border-slate-200/50 hover:border-blue-400 transition-colors">
                                                <div className="w-full h-full rounded-lg overflow-hidden relative grayscale hover:grayscale-0 transition-all">
                                                    <img src={img} alt={`Frame ${index + 1}`} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                </div>
                                                <button
                                                    onClick={() => removeImage(index)}
                                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 lg:group-hover:opacity-100 transition-opacity hover:scale-110"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Meta Data Form */}
                    <div className="lg:col-span-12 xl:col-span-7">
                        <div className="glass-card p-8 border-slate-200/40 relative h-full">
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-8">Student Details</h2>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-xs uppercase font-bold tracking-wide text-slate-400 block ml-1">Full Name</label>
                                        <input
                                            type="text" required placeholder="Full Name"
                                            value={formData.studentName}
                                            onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                                            className="glass-input"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs uppercase font-bold tracking-wide text-slate-400 block ml-1">Student ID</label>
                                        <input
                                            type="text" required placeholder="Student ID"
                                            value={formData.studentId}
                                            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                            className="glass-input font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold tracking-wide text-slate-400 block ml-1">Department</label>
                                        <div className="glass-select-wrapper">
                                            <select
                                                required value={formData.department}
                                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                className="glass-input glass-select w-full text-xs h-12"
                                            >
                                                <option value="">Department</option>
                                                <option value="MCA">MCA</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold tracking-wide text-slate-400 block ml-1">Year</label>
                                        <div className="glass-select-wrapper">
                                            <select
                                                required value={formData.year}
                                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                                className="glass-input glass-select w-full text-xs h-12"
                                            >
                                                <option value="">Year</option>
                                                <option value="1st Year">1st Year</option>
                                                <option value="2nd Year">2nd Year</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold tracking-wide text-slate-400 block ml-1">Division</label>
                                        <div className="glass-select-wrapper">
                                            <select
                                                required value={formData.division}
                                                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                                                className="glass-input glass-select w-full text-xs h-12"
                                            >
                                                <option value="">Division</option>
                                                <option value="G1">G1</option>
                                                <option value="G2">G2</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold tracking-wide text-slate-400 block ml-1">Semester</label>
                                        <div className="glass-select-wrapper">
                                            <select
                                                required value={formData.semester}
                                                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                                className="glass-input glass-select w-full text-xs h-12"
                                            >
                                                <option value="">Semester</option>
                                                <option value="1">1</option>
                                                <option value="2">2</option>
                                                <option value="3">3</option>
                                                <option value="4">4</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                    <div className="space-y-3">
                                        <label className="text-xs uppercase font-bold tracking-wide text-slate-400 block ml-1">Email Address</label>
                                        <input
                                            type="email" required placeholder="student@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="glass-input"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs uppercase font-bold tracking-wide text-slate-400 block ml-1">Phone Number</label>
                                        <input
                                            type="tel" required placeholder="+91 00000 00000"
                                            value={formData.phoneNumber}
                                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                            className="glass-input"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                    <div className="space-y-3">
                                        <label className="text-xs uppercase font-bold tracking-wide text-slate-400 block ml-1">Login Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                placeholder="Create login password"
                                                value={formData.loginPassword}
                                                onChange={(e) => setFormData({ ...formData, loginPassword: e.target.value })}
                                                className="glass-input pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10">
                                    <button
                                        type="submit"
                                        disabled={loading || capturedImages.length !== 5}
                                        className="w-full h-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale disabled:scale-100 flex items-center justify-center gap-4 relative overflow-hidden group border-none"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                        {loading ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                                    <CheckCircle className="w-4 h-4" />
                                                </div>
                                                Register Student
                                            </>
                                        )}
                                    </button>
                                    <p className="text-center text-xs font-medium text-slate-400 uppercase tracking-wide mt-6 italic opacity-60">Powered by High Accuracy Face Recognition</p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
