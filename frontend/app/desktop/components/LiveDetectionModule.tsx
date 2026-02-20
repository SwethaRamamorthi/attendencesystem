'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, AlertCircle, CheckCircle, XCircle, ClipboardCheck, Activity, ChevronDown } from 'lucide-react';

interface DetectionResult {
    match: { user_id: string; name: string } | null;
    distance: number;
    confidence: number;
    box: [number, number, number, number];
}

interface AttendanceRecord {
    studentId: string;
    studentName: string;
    time: string;
    marked: boolean;
}

export default function LiveDetectionModule() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isActive, setIsActive] = useState(false);
    const [detections, setDetections] = useState<DetectionResult[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceRecord>>(new Map());
    const [error, setError] = useState('');
    const [fps, setFps] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const animationRef = useRef<number | null>(null);
    const isProcessing = useRef(false);

    // ── Camera selection ────────────────────────────────────
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string>('');

    const enumerateCameras = useCallback(async () => {
        try {
            // Request permission first so labels are populated
            await navigator.mediaDevices.getUserMedia({ video: true }).then(s => s.getTracks().forEach(t => t.stop()));
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            setCameras(videoDevices);
            if (videoDevices.length > 0 && !selectedCamera) {
                setSelectedCamera(videoDevices[0].deviceId);
            }
        } catch {
            // Permission denied — fall back to default camera
        }
    }, [selectedCamera]);

    useEffect(() => { enumerateCameras(); }, []);
    // ────────────────────────────────────────────────────────

    useEffect(() => {
        if (isActive) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isActive]);

    const startCamera = async () => {
        try {
            const constraints: MediaStreamConstraints = {
                video: {
                    width: 640,
                    height: 480,
                    frameRate: { ideal: 30 },
                    ...(selectedCamera ? { deviceId: { exact: selectedCamera } } : {}),
                },
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();

                renderLoop();

                intervalRef.current = setInterval(() => {
                    if (!isProcessing.current) {
                        captureAndDetect();
                    }
                }, 300);
            }
        } catch (err) {
            setError('Failed to access camera. Please grant camera permissions.');
            setIsActive(false);
        }
    };

    const stopCamera = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }

        setDetections([]);
        setAttendanceRecords(new Map());
        isProcessing.current = false;
    };

    const getCurrentPeriod = () => {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const totalMinutes = hour * 60 + minute;

        // Simplified Period Map (9:00 AM start, 50 min periods, 10 min breaks)
        // P1: 9:00 - 9:50
        // P2: 10:00 - 10:50
        // P3: 11:00 - 11:50
        // P4: 12:00 - 12:50
        // P5: 14:00 - 14:50 (Post Lunch)
        // P6: 15:00 - 15:50
        // P7: 16:00 - 16:50

        if (totalMinutes >= 540 && totalMinutes < 590) return "1";
        if (totalMinutes >= 600 && totalMinutes < 650) return "2";
        if (totalMinutes >= 660 && totalMinutes < 710) return "3";
        if (totalMinutes >= 720 && totalMinutes < 770) return "4";
        if (totalMinutes >= 840 && totalMinutes < 890) return "5";
        if (totalMinutes >= 900 && totalMinutes < 950) return "6";
        if (totalMinutes >= 960 && totalMinutes < 1010) return "7";
        return "N/A";
    };

    const renderLoop = () => {
        if (!isActive || !videoRef.current || !overlayCanvasRef.current) return;

        const canvas = overlayCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (canvas.width !== videoRef.current.videoWidth || canvas.height !== videoRef.current.videoHeight) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawDetections(detections, ctx);

        animationRef.current = requestAnimationFrame(renderLoop);
    };

    const markAttendance = async (studentId: string, studentName: string) => {
        // Check if already marked
        if (attendanceRecords.has(studentId)) {
            return;
        }

        try {
            // 1. Get current subject from timetable
            let sessionName = 'Live Detection';
            let period = getCurrentPeriod();
            let teacher = '';

            try {
                const subjectResponse = await fetch('http://localhost:5000/api/attendance/current-subject', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentId })
                });

                if (subjectResponse.ok) {
                    const subjectData = await subjectResponse.json();
                    if (subjectData.success) {
                        sessionName = subjectData.subject;
                        period = subjectData.period;
                        teacher = subjectData.teacher;
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch current subject:', err);
            }

            // 2. Mark attendance with specific subject
            const response = await fetch('http://localhost:5000/api/attendance/mark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    studentName,
                    sessionName: sessionName,
                    period: period
                }),
            });

            const data = await response.json();

            if (data.success) {
                const newRecord: AttendanceRecord = {
                    studentId,
                    studentName,
                    time: data.record.time,
                    marked: true
                };

                setAttendanceRecords(prev => new Map(prev).set(studentId, newRecord));

                const duplicateMsg = data.duplicate ? '(already marked)' : '';
                const subjectMsg = sessionName !== 'Live Detection' ? `for ${sessionName}` : '';
                console.log(`✅ Attendance marked for ${studentName} ${subjectMsg} ${duplicateMsg}`);

                // Optional: You could add a toast notification here showing the subject name
            }
        } catch (err) {
            console.error('Error marking attendance:', err);
        }
    };

    const captureAndDetect = async () => {
        if (!videoRef.current || !canvasRef.current || isProcessing.current) return;

        isProcessing.current = true;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            isProcessing.current = false;
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg', 0.7);

        try {
            const startTime = performance.now();
            const response = await fetch('http://localhost:5000/api/demo/recognize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData }),
            });

            const data = await response.json();
            const endTime = performance.now();

            if (data.success) {
                setDetections(data.faces);
                const processingTime = endTime - startTime;
                setFps(Math.round(1000 / processingTime));

                // Auto-mark attendance for detected registered students
                data.faces.forEach((face: DetectionResult) => {
                    if (face.match) {
                        markAttendance(face.match.user_id, face.match.name);
                    }
                });
            }
        } catch (err) {
            console.error('Detection error:', err);
        } finally {
            isProcessing.current = false;
        }
    };

    const drawDetections = (_faces: DetectionResult[], ctx: CanvasRenderingContext2D) => {
        // Overlay drawing disabled — clean live feed, no markings
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        Live Attendance
                        {isActive && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] uppercase font-black tracking-widest border border-red-100 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                                Live
                            </div>
                        )}
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Automatic attendance marking via face recognition</p>
                </div>
                <button
                    onClick={() => setIsActive(!isActive)}
                    className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all duration-500 shadow-xl hover:scale-105 active:scale-95 group relative overflow-hidden ${isActive
                        ? 'bg-red-500 text-white shadow-red-200'
                        : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-indigo-200'
                        }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <Camera className={`w-5 h-5 transition-transform duration-500 ${isActive ? 'rotate-12' : 'group-hover:rotate-12'}`} />
                    {isActive ? 'Stop Camera' : 'Start Camera'}
                </button>
            </div>

            {error && (
                <div className="glass-card border-red-200 bg-red-50/30 p-5 text-red-600 flex items-center gap-4 animate-bounce-gentle">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shadow-inner">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="font-bold uppercase tracking-tight">Error</p>
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                </div>
            )}

            {/* Camera Selector — shown when camera is off */}
            {!isActive && cameras.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <Camera className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Camera</p>
                        <div className="relative">
                            <select
                                value={selectedCamera}
                                onChange={(e) => setSelectedCamera(e.target.value)}
                                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-400 focus:border-transparent cursor-pointer"
                            >
                                {cameras.map((cam, i) => (
                                    <option key={cam.deviceId} value={cam.deviceId}>
                                        {cam.label || `Camera ${i + 1}`}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="shrink-0 text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                        {cameras.length} device{cameras.length !== 1 ? 's' : ''} found
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    {/* Primary Feed Case */}
                    <div className="glass-card p-4 relative group overflow-hidden border-blue-100/30">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video shadow-2xl border border-slate-900 group-hover:border-blue-500/30 transition-colors">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-contain mix-blend-screen"
                                playsInline
                                muted
                            />
                            <canvas ref={canvasRef} className="hidden" />
                            <canvas
                                ref={overlayCanvasRef}
                                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                            />

                            {!isActive && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm">
                                    <div className="text-center group-hover:scale-110 transition-transform duration-500">
                                        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glossy border border-slate-700">
                                            <Camera className="w-10 h-10 text-slate-500" />
                                        </div>
                                        <p className="text-slate-400 font-bold uppercase tracking-wide text-xs">Camera Ready</p>
                                    </div>
                                </div>
                            )}

                            {/* Internal Overlays */}
                            {isActive && (
                                <div className="absolute top-6 left-6 flex items-center gap-3">
                                    <div className="glass-container bg-white/10 border-white/20 backdrop-blur-md px-4 py-2 flex items-center gap-2.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">System Active</span>
                                    </div>
                                    <div className="glass-container bg-white/10 border-white/20 backdrop-blur-md px-4 py-2">
                                        <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest font-mono">{fps || '--'} FPS</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {isActive && (
                            <div className="mt-6 flex items-center justify-between px-2">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Faces Detected</span>
                                        <span className="text-sm font-bold text-slate-700">{detections.length} Faces</span>
                                    </div>
                                    <div className="h-8 w-px bg-slate-200"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Attendance Marked</span>
                                        <span className="text-sm font-bold text-slate-700">{attendanceRecords.size} Students</span>
                                    </div>
                                </div>
                                <div className="hidden sm:flex -space-x-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                            {i}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Verified Queue Segment */}
                    {attendanceRecords.size > 0 && (
                        <div className="glass-card p-8 bg-gradient-to-br from-green-600/95 to-teal-600/95 text-white border-none shadow-glossy relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>

                            <div className="flex items-center gap-4 mb-8 relative">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] backdrop-blur-md">
                                    <ClipboardCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight">Recent Attendance</h3>
                                    <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest opacity-80">Real-time Cloud Updates</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                                {Array.from(attendanceRecords.values()).slice(-4).reverse().map((record, index) => (
                                    <div key={index} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center justify-between hover:bg-white/20 transition-all font-sans">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center font-black text-lg">
                                                {record.studentName[0]}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="font-black text-sm truncate">{record.studentName}</p>
                                                <p className="text-[10px] font-bold opacity-70 font-mono tracking-tighter">{record.studentId}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black font-mono">{record.time}</p>
                                            <div className="flex items-center justify-end gap-1 mt-0.5">
                                                <CheckCircle className="w-3 h-3 text-green-300" />
                                                <span className="text-[9px] font-bold uppercase">Marked</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Analytical Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="glass-card p-8 h-full min-h-[500px] flex flex-col">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                                <Activity className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Detection Status</h2>
                        </div>

                        {detections.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-slate-200">
                                    <Activity className="w-10 h-10 text-slate-300" />
                                </div>
                                <p className="font-bold text-slate-400 uppercase tracking-wide text-xs">Waiting for faces...</p>
                            </div>
                        ) : (
                            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                {detections.map((detection, index) => {
                                    const isMarked = detection.match && attendanceRecords.has(detection.match.user_id);
                                    return (
                                        <div
                                            key={index}
                                            className={`p-5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${detection.match
                                                ? isMarked
                                                    ? 'border-green-200 bg-green-50/50'
                                                    : 'border-blue-200 bg-blue-50/50 shadow-blue-soft'
                                                : 'border-red-100 bg-red-50/30'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-glossy ${detection.match ? (isMarked ? 'bg-green-600' : 'bg-blue-600') : 'bg-red-500'
                                                    } text-white`}>
                                                    {detection.match ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <h3 className="font-bold text-slate-800 tracking-tight truncate">
                                                        {detection.match ? detection.match.name : 'Unknown Person'}
                                                    </h3>
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                        {detection.match ? (isMarked ? 'Attendance Marked' : 'Student Recognized') : 'Not Registered'}
                                                    </p>
                                                </div>
                                            </div>

                                            {detection.match && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                                                        <span>Confidence</span>
                                                        <span className="font-black font-mono text-slate-800">{Math.round(detection.confidence)}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ${isMarked ? 'bg-green-600' : 'bg-blue-600'}`}
                                                            style={{ width: `${Math.min(detection.confidence, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Mode</span>
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200/50">Automatic</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
