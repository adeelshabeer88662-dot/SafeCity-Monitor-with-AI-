
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Camera, Upload, Play, Square, AlertCircle, CheckCircle, Activity, X, ShieldAlert, ShieldCheck, FileText, BarChart3, Fingerprint } from 'lucide-react';
import { processFrame, fetchLogs } from '../services/flaskApi';
import { DetectionResult, ViolationType } from '../types';
import { THRESHOLD_KEY, STORAGE_KEY } from '../constants';

const Surveillance: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logs, setLogs] = useState<DetectionResult[]>([]);
  const [mediaType, setMediaType] = useState<'camera' | 'video' | 'image' | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

  // State for tracking detections of the current file/session
  const [sessionDetections, setSessionDetections] = useState<DetectionResult[]>([]);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1280, height: 720 });
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Derived stats for the report
  const reportStats = useMemo(() => {
    const violationDetections = sessionDetections.filter(d => d.type === ViolationType.NO_HELMET);
    const compliantDetections = sessionDetections.filter(d => d.type === ViolationType.COMPLIANT);

    const uniquePlates = Array.from(new Set(sessionDetections.map(d => d.plateNumber))).filter(p => p !== 'UNKNOWN' && p !== 'NUMBER PLATE');

    return {
      total: violationDetections.length + compliantDetections.length,
      violations: violationDetections.length,
      compliant: compliantDetections.length,
      uniquePlatesCount: uniquePlates.length,
      plates: uniquePlates
    };
  }, [sessionDetections]);

  const getThreshold = () => {
    const saved = localStorage.getItem(THRESHOLD_KEY);
    return saved ? parseFloat(saved) : 0.75;
  };

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setActiveStream(stream);
      setIsStreaming(true);
      setMediaType('camera');
      setMediaUrl(null);
      setAnnotatedImage(null);
      setSessionDetections([]); // Reset session for new source
      clearCanvas();
      console.log("DEBUG: Camera stream active");
    } catch (err) {
      console.error("Camera error:", err);
      alert("Camera access denied.");
    }
  };

  const stopStream = () => {
    if (activeStream) {
      activeStream.getTracks().forEach(track => track.stop());
      setActiveStream(null);
    }
    setIsStreaming(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    setAnnotatedImage(null);
    stopStream();
    setSessionDetections([]); // Reset session for new file

    if (file.type.startsWith('video/')) {
      if (videoRef.current) videoRef.current.srcObject = null;
      setMediaType('video');
      setIsStreaming(true);
    } else if (file.type.startsWith('image/')) {
      if (videoRef.current) videoRef.current.srcObject = null;
      setMediaType('image');
      setIsStreaming(false);
    }
    clearCanvas();
    // Reset input so the same file can be uploaded again
    if (e.target) e.target.value = '';
  };

  const clearMedia = () => {
    stopAnalysis();
    stopStream();
    setMediaType(null);
    setMediaUrl(null);
    setAnnotatedImage(null);
    setSessionDetections([]);
    clearCanvas();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Optimize: Only update state if dimensions actually change to prevent re-renders that verify canvas
      let newWidth = 0;
      let newHeight = 0;
      let shouldUpdate = false;

      if (mediaType === 'image' && imageRef.current) {
        newWidth = imageRef.current.naturalWidth;
        newHeight = imageRef.current.naturalHeight;
      } else if (videoRef.current) {
        newWidth = videoRef.current.videoWidth;
        newHeight = videoRef.current.videoHeight;
      }

      if (newWidth > 0 && newHeight > 0) {
        if (newWidth !== canvasDimensions.width || newHeight !== canvasDimensions.height) {
          console.log(`DEBUG: Updating canvas dimensions to ${newWidth}x${newHeight}`);
          setCanvasDimensions({ width: newWidth, height: newHeight });
          shouldUpdate = true;
        }
      }

      // Explicitly clear context
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const drawDetections = (detections: any[]) => {
    console.log(`DEBUG: drawDetections called with ${detections.length} items`);
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn("DEBUG: Canvas ref is null during draw");
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas dimensions are now React-managed via canvasDimensions state
    // We clear here to ensure we don't draw over old frames if logic assumes fresh frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach(det => {
      if (!det.box || det.box.length !== 4) {
        console.warn("DEBUG: Invalid box for detection", det);
        return;
      }
      const [x1, y1, x2, y2] = det.box;
      const color = `rgb(${det.color[2]}, ${det.color[1]}, ${det.color[0]})`; // BGR to RGB

      const rectX = Math.min(x1, x2);
      const rectY = Math.min(y1, y2);
      const rectW = Math.abs(x2 - x1);
      const rectH = Math.abs(y2 - y1);

      ctx.strokeStyle = color;
      ctx.lineWidth = 4; // Bold lines for visibility
      ctx.strokeRect(rectX, rectY, rectW, rectH);

      // Label background box - more prominent
      ctx.fillStyle = color;
      ctx.fillRect(rectX - 2, rectY - 30, rectW + 4, 30);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px Inter';
      const label = `${det.label.toUpperCase()} (${(det.confidence * 100).toFixed(0)}%)`;
      ctx.fillText(label, rectX + 5, rectY - 8);
    });
  };

  const triggerFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
  };

  const performAnalysis = async () => {
    let base64 = "";
    if (mediaType === 'image' && imageRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = imageRef.current.naturalWidth;
      canvas.height = imageRef.current.naturalHeight;
      canvas.getContext('2d')?.drawImage(imageRef.current, 0, 0);
      base64 = canvas.toDataURL('image/jpeg', 0.9);
      console.log("DEBUG: Captured frame from image successfully");
    } else if (videoRef.current) {
      // Ensure video is ready
      if (videoRef.current.readyState < 2 || videoRef.current.videoWidth === 0) {
        console.warn("DEBUG: Video not ready for frame capture", {
          readyState: videoRef.current.readyState,
          width: videoRef.current.videoWidth,
          src: videoRef.current.src ? "blob-url" : "camera"
        });
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      base64 = canvas.toDataURL('image/jpeg', 0.8);
      console.log("DEBUG: Captured frame from video/camera successfully", { width: canvas.width, height: canvas.height });
    }

    if (!base64) return;

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsAnalyzing(true);
    try {
      const sourceMap = { camera: 'LIVE-UNIT-01', video: 'VIDEO-ANALYSIS', image: 'IMAGE-EVIDENCE' };
      const sourceTag = sourceMap[mediaType || 'image'];

      const result = await processFrame(base64, sourceTag, abortControllerRef.current.signal);
      setIsAnalyzing(false);

      console.log(`DEBUG: AI Core result for ${sourceTag}:`, result);

      if (!result || !result.detections) {
        console.warn("DEBUG: No detections returned from AI Core");
        return;
      }

      const mappedResults = result.detections.map((d: any) => ({
        ...d,
        plateNumber: d.plate_number || d.label || 'UNKNOWN',
        timestamp: Date.now(),
        // Ensure type matches the enum exactly
        type: d.type === 'NO_HELMET' ? ViolationType.NO_HELMET :
          d.type === 'COMPLIANT' ? ViolationType.COMPLIANT : d.type
      }));

      if (abortControllerRef.current?.signal.aborted) {
        console.log("DEBUG: Request was aborted, skipping update");
        return;
      }

      console.log(`DEBUG: Final mapped detections: ${mappedResults.length}`, mappedResults);

      if (mappedResults.length > 0) {
        if (mediaType === 'image' && result.annotated_image) {
          setAnnotatedImage(result.annotated_image);
          clearCanvas();
        } else {
          clearCanvas(); // Update dimensions before drawing
          // Small timeout to ensure state update for dimensions has propagated
          setTimeout(() => drawDetections(mappedResults), 0);
        }

        // Update local logs from backend data
        try {
          const backendLogs = await fetchLogs();
          console.log(`DEBUG: Fetched ${backendLogs.length} historical logs`);
          setLogs(backendLogs);
        } catch (logErr) {
          console.error("DEBUG: Failed to fetch historical logs", logErr);
        }

        // Update current session view
        // For images, we REPLACE the detections so they don't stack up on multiple clicks
        // For camera/video, we APPEND to show history
        setSessionDetections(prev => {
          if (mediaType === 'image') {
            console.log(`DEBUG: Session replaced with ${mappedResults.length} detections`);
            return mappedResults;
          }
          const newSession = [...prev, ...mappedResults];
          console.log(`DEBUG: Session detections updated. Total: ${newSession.length}`);
          return newSession;
        });

        if (mappedResults.some((r: any) => r.type === ViolationType.NO_HELMET)) {
          console.log("DEBUG: Violation detected! Triggering flash...");
          triggerFlash();
        }
      } else {
        console.log("DEBUG: Analysis complete, but no objects were detected in this frame.");
        clearCanvas(); // Prevent ghosting of old detections
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("DEBUG: Analysis aborted.");
      } else {
        console.error("CRITICAL: Inference Error:", error);
      }
      setIsAnalyzing(false);
    }
  };

  const updateLogs = (results: any[]) => {
    // This is now handled by fetching from backend in performAnalysis
  };

  const startAnalysis = () => {
    performAnalysis();

    // Continuous interval ONLY for camera/video
    // Images are analyzed ONCE to prevent duplication
    if (mediaType === 'camera' || mediaType === 'video') {
      const interval = 1000;
      analysisTimerRef.current = window.setInterval(performAnalysis, interval) as unknown as number;
      console.log(`DEBUG: Analysis started for ${mediaType} with ${interval}ms interval`);
    } else {
      console.log("DEBUG: One-shot analysis run for static image");
    }
  };

  const stopAnalysis = () => {
    if (analysisTimerRef.current) {
      clearInterval(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAnalyzing(false);
  };

  useEffect(() => {
    if (videoRef.current) {
      if (mediaType === 'camera') {
        videoRef.current.srcObject = activeStream;
      } else if (mediaType === 'video') {
        videoRef.current.srcObject = null;
      }
    }
  }, [mediaType, activeStream, mediaUrl]);

  useEffect(() => {
    return () => {
      stopAnalysis();
      stopStream();
      // Only clear if actually unmounting or source totally gone
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    };
  }, [mediaUrl]);

  const openEvidence = (path: string) => {
    window.open(`http://127.0.0.1:5000/${path}`, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-12 animate-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-3 space-y-6">
        {/* Top Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="text-indigo-500" size={24} />
              AI Command Center
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${isStreaming || mediaType === 'image' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {mediaType === 'camera' ? 'Live Camera Feed' : mediaType === 'video' ? 'Processing Video File' : mediaType === 'image' ? 'Static Evidence View' : 'Standby'}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            {mediaType ? (
              <>
                <button
                  onClick={(analysisTimerRef.current || isAnalyzing) ? stopAnalysis : startAnalysis}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all font-bold shadow-lg ${(analysisTimerRef.current || isAnalyzing) ? 'bg-red-600/20 text-red-500 border border-red-500/30' : 'bg-emerald-600 text-white shadow-emerald-600/20'}`}
                >
                  {(analysisTimerRef.current || isAnalyzing) ? <Square size={18} /> : <Play size={18} />}
                  {(analysisTimerRef.current || isAnalyzing) ? 'Stop Processing' : (mediaType === 'image' ? 'Run Analysis' : 'Start Processing')}
                </button>
                <button
                  onClick={clearMedia}
                  className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all font-semibold border border-slate-700"
                >
                  <X size={18} /> Reset
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={startStream}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-semibold shadow-lg shadow-indigo-600/20"
                >
                  <Camera size={18} /> Enable Camera
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/*,image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-semibold border border-slate-700"
                >
                  <Upload size={18} /> Analyze Files
                </button>
              </>
            )}
          </div>
        </div>

        {/* Video Player Section */}
        <div className={`relative aspect-video bg-black rounded-3xl overflow-hidden border-2 transition-all duration-300 shadow-2xl flex items-center justify-center ${flash ? 'ring-4 ring-red-500' : 'border-slate-800'}`}>
          {flash && <div className="absolute inset-0 bg-red-500/20 z-10 animate-pulse pointer-events-none" />}

          {mediaType === 'image' ? (
            <img
              key={annotatedImage || mediaUrl || 'empty'}
              ref={imageRef}
              src={annotatedImage || mediaUrl!}
              className="w-full h-full object-contain"
              alt="Uploaded Source"
            />
          ) : (
            <video
              key={mediaUrl || 'camera'}
              ref={videoRef}
              src={mediaType === 'video' ? mediaUrl! : undefined}
              autoPlay
              playsInline
              muted
              loop={mediaType === 'video'}
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
              onLoadedMetadata={() => {
                console.log("DEBUG: Video metadata loaded", { w: videoRef.current?.videoWidth, h: videoRef.current?.videoHeight });
                clearCanvas(); // Update canvas dimensions now that we have width/height
              }}
            />
          )}

          <canvas
            ref={canvasRef}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            className={`absolute inset-0 w-full h-full pointer-events-none z-20 ${mediaType === 'image' ? 'object-contain' : 'object-cover'}`}
          />

          {!mediaType && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md">
              <div className="p-8 bg-slate-800 rounded-full mb-6 border border-slate-700 shadow-xl">
                <ShieldAlert size={64} className="text-indigo-500 animate-pulse" />
              </div>
              <p className="text-slate-300 text-center max-w-sm font-medium text-lg">SafeCity System Standby</p>
              <p className="text-slate-500 text-sm mt-2">Connect a stream or upload files for neural analysis.</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="absolute bottom-6 right-6 bg-slate-900/90 px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xl border border-indigo-500/30 z-30">
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-ping"></div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Inference Hub</span>
                <span className="text-xs font-bold text-white uppercase tracking-tighter">Analyzing Frame Data...</span>
              </div>
            </div>
          )}
        </div>

        {/* Analysis Report Section (Under Page) */}
        {mediaType && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg">
                    <BarChart3 size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Analysis Summary Report</h3>
                </div>
                {mediaType !== 'camera' && (
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Source: {mediaType.toUpperCase()} FILE</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Scanned</div>
                  <div className="text-2xl font-black text-white">{reportStats.total}</div>
                </div>
                <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                  <div className="text-[10px] font-bold text-red-400 uppercase mb-1">Violations</div>
                  <div className="text-2xl font-black text-red-500">{reportStats.violations}</div>
                </div>
                <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Compliant</div>
                  <div className="text-2xl font-black text-emerald-500">{reportStats.compliant}</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                  <Fingerprint size={14} className="text-amber-500" />
                  Identified License Plates
                </h4>
                {reportStats.plates.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {reportStats.plates.map((plate, i) => (
                      <span key={i} className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md font-mono text-xs font-bold uppercase tracking-widest">
                        {plate}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 italic">No alphanumeric plate data extracted yet.</p>
                )}
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileText size={20} className="text-indigo-400" />
                Evidence Logs
              </h3>
              <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                {sessionDetections.length === 0 ? (
                  <div className="text-center py-10 opacity-30 grayscale">
                    <Activity size={32} className="mx-auto mb-2" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Session Empty</p>
                  </div>
                ) : (
                  sessionDetections.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-slate-700/30">
                      <div>
                        <div className="text-[10px] font-bold text-white uppercase tracking-tighter">Plate: {d.plateNumber}</div>
                        <div className="text-[9px] text-slate-500">{new Date(d.timestamp).toLocaleTimeString()}</div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${d.type === ViolationType.NO_HELMET ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                    </div>
                  ))
                )}
              </div>
              <button className="w-full mt-6 py-2 bg-indigo-600/10 text-indigo-400 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-600/20 transition-all">
                Export Session Data
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side Bar Log */}
      <div className="bg-[#1E293B] rounded-3xl border border-slate-800 flex flex-col overflow-hidden shadow-2xl h-full lg:sticky lg:top-8 max-h-[calc(100vh-120px)]">
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-indigo-400" />
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Live Violation Log</h3>
          </div>
          <span className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded-md font-bold shadow-lg">{logs.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40 text-center px-4 grayscale py-20">
              <div className="p-4 bg-slate-800 rounded-2xl mb-4">
                <ShieldCheck size={40} className="text-slate-600" />
              </div>
              <p className="text-xs uppercase font-bold tracking-widest text-slate-400">Monitoring Sector Active</p>
              <p className="text-[10px] mt-2 leading-relaxed text-slate-500">Awaiting visual trigger from monitored zones.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`p-4 rounded-2xl border transition-all duration-300 animate-in slide-in-from-right-4 group relative overflow-hidden ${log.type === ViolationType.NO_HELMET
                  ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/15'
                  : 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15'
                  }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md shadow-sm ${log.type === ViolationType.NO_HELMET ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                      {log.type.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">License Plate</div>
                    <div className="text-lg font-mono font-black text-amber-500 tracking-widest leading-none">
                      {log.plateNumber}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    {log.type === ViolationType.NO_HELMET ? <ShieldAlert className="text-red-500" size={20} /> : <ShieldCheck className="text-emerald-500" size={20} />}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">AI CONFIDENCE: {(log.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-[9px] text-slate-500 italic">Snapshot Captured</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Surveillance;
