import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import api, { createPost } from '../api';

export default function Post() {
  const [mediaKind, setMediaKind] = useState('video'); // 'video' or 'image'
  const [source, setSource] = useState('upload'); // 'upload' or 'camera'
  const [composerOpen, setComposerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraFilter, setCameraFilter] = useState('none');
  const [celebrate, setCelebrate] = useState(false);
  const [cameraStats, setCameraStats] = useState(null);

  const [local, setLocal] = useState(null); // { file, url, duration }
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraOverlay, setCameraOverlay] = useState(false); // full-screen camera UI
  const filterStyles = {
    none: 'none',
    vivid: 'saturate(1.25) contrast(1.05)',
    mono: 'grayscale(1) contrast(1.2)',
    warm: 'sepia(0.3) saturate(1.1)',
    cool: 'contrast(1.05) saturate(1.05) hue-rotate(8deg)'
  };
  const appliedFilter = filterStyles[cameraFilter] || 'none';

  const videoRef = useRef(); // preview playback
  const cameraVideoRef = useRef(); // dedicated to live camera stream
  const attachAttemptsRef = useRef(0);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const cameraDebugTimerRef = useRef(null);
  const attachTimerRef = useRef(null);

  const navigate = useNavigate();

  // Retry attaching the stream to the video element a few times to combat blank preview
  useEffect(() => {
    if (!cameraOverlay || !streamRef.current) return;
    attachAttemptsRef.current = 0;

    const tryAttach = () => {
      attachAttemptsRef.current += 1;
      if (!cameraVideoRef.current || !streamRef.current) return;
      cameraVideoRef.current.srcObject = streamRef.current;
      cameraVideoRef.current.muted = true;
      cameraVideoRef.current.playsInline = true;
      cameraVideoRef.current.setAttribute('autoplay', 'true');
      if (cameraVideoRef.current.readyState >= 2 && cameraVideoRef.current.paused) {
        cameraVideoRef.current.play().catch((e) => console.warn('Attach play failed', e));
      }

      if (cameraVideoRef.current) {
        setCameraStats({
          readyState: cameraVideoRef.current.readyState,
          videoWidth: cameraVideoRef.current.videoWidth,
          videoHeight: cameraVideoRef.current.videoHeight,
          paused: cameraVideoRef.current.paused
        });
      }

      if (attachAttemptsRef.current < 6 && (!cameraVideoRef.current.videoWidth || cameraVideoRef.current.paused)) {
        attachTimerRef.current = setTimeout(tryAttach, 260);
      }
    };

    tryAttach();

    return () => {
      if (attachTimerRef.current) clearTimeout(attachTimerRef.current);
    };
  }, [cameraOverlay]);

  const handleFileChange = (e) => {
    setError(null);
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (mediaKind === 'video' && !f.type.startsWith('video/')) return setError('Please select a video file');
    if (mediaKind === 'image' && !f.type.startsWith('image/')) return setError('Please select an image file');

    const url = URL.createObjectURL(f);
    setLocal({ file: f, url, duration: null });
  };

  const onLoadedMetadata = () => {
    if (!videoRef.current) return;
    const d = Math.round(videoRef.current.duration);
    setLocal(prev => ({ ...prev, duration: d }));
    if (mediaKind === 'video') {
      if (d < 5 || d > 60) setError('Video must be between 5 and 60 seconds');
      else setError(null);
    }
  };

  // Camera / recording
  const startCamera = async () => {
    setError(null);
    try {
      const constraints = {
        video: { facingMode: 'user' },
        audio: mediaKind === 'video'
      };
      console.log('Camera requested with constraints', constraints);
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream acquired', s.getVideoTracks().map(t => ({ label: t.label, readyState: t.readyState })), s.getAudioTracks().map(t => ({ label: t.label, readyState: t.readyState })));
      streamRef.current = s;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = s;
        cameraVideoRef.current.muted = true;
        cameraVideoRef.current.playsInline = true;
        cameraVideoRef.current.setAttribute('autoplay', 'true');
        const waitForReady = () => new Promise((resolve) => {
          cameraVideoRef.current.onloadedmetadata = () => resolve();
          if (cameraVideoRef.current.readyState >= 2) resolve();
        });
        await waitForReady();
        console.log('Camera video metadata ready', {
          readyState: cameraVideoRef.current.readyState,
          videoWidth: cameraVideoRef.current.videoWidth,
          videoHeight: cameraVideoRef.current.videoHeight
        });
        try { await cameraVideoRef.current.play(); console.log('Camera video play called'); } catch (e) { console.warn('Camera play failed', e); }
        setTimeout(() => {
          if (cameraVideoRef.current && cameraVideoRef.current.paused) {
            try { cameraVideoRef.current.play(); console.log('Camera video play retry'); } catch (e) { console.warn('Camera play retry failed', e); }
          }
        }, 150);
        if (cameraDebugTimerRef.current) clearTimeout(cameraDebugTimerRef.current);
        cameraDebugTimerRef.current = setTimeout(() => {
          if (cameraVideoRef.current) {
            console.log('Camera debug after 1s', {
              readyState: cameraVideoRef.current.readyState,
              videoWidth: cameraVideoRef.current.videoWidth,
              videoHeight: cameraVideoRef.current.videoHeight,
              paused: cameraVideoRef.current.paused
            });
            setCameraStats({
              readyState: cameraVideoRef.current.readyState,
              videoWidth: cameraVideoRef.current.videoWidth,
              videoHeight: cameraVideoRef.current.videoHeight,
              paused: cameraVideoRef.current.paused
            });
          }
        }, 1000);
      }
      recordedChunksRef.current = [];
      setIsRecording(false);
      setLocal(null);
      setCameraOverlay(true);
    } catch (err) {
      console.error('Camera error', err);
      setError('Could not access camera. Check permissions.');
      setCameraOverlay(false);
    }
  };

  const stopStream = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
      if (cameraDebugTimerRef.current) clearTimeout(cameraDebugTimerRef.current);
      if (attachTimerRef.current) clearTimeout(attachTimerRef.current);
      setCameraStats(null);
    } catch (e) {}
  };

  const startRecording = () => {
    if (!streamRef.current) return setError('Camera not started');
    try {
      recordedChunksRef.current = [];
      const options = { mimeType: 'video/webm;codecs=vp9' };
      const mr = new MediaRecorder(streamRef.current, options);
      recorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data && e.data.size) recordedChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `recording_${Date.now()}.webm`, { type: 'video/webm' });
        const url = URL.createObjectURL(file);
        setLocal({ file, url, duration: null });
        stopStream();
        setCameraOverlay(false);
        setIsRecording(false);
      };
      mr.start();
      setIsRecording(true);
      recordTimerRef.current = setTimeout(() => stopRecording(), 60000);
    } catch (err) {
      console.error('Record error', err);
      setError('Could not start recording.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    try { clearTimeout(recordTimerRef.current); } catch (e) {}
    try {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      } else {
        stopStream();
        setCameraOverlay(false);
      }
    } catch (e) {}
    setIsRecording(false);
  };

  const capturePhoto = () => {
    if (!cameraVideoRef.current) return setError('Camera not started');
    const video = cameraVideoRef.current;
    console.log('Capture attempt', {
      readyState: video.readyState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      paused: video.paused
    });
    if (video.readyState < 2) return setError('Camera is loading, try again in a moment');
    if (!video.videoWidth || !video.videoHeight) return setError('Camera not ready yet. Wait a second and try again.');
    // wait for next frame to avoid blank canvas
    try {
      const rafPromise = new Promise((resolve) => requestAnimationFrame(() => resolve()))
      return rafPromise.then(() => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.filter = appliedFilter;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          const file = new File([blob], `photo_${Date.now()}.png`, { type: 'image/png' });
          const url = URL.createObjectURL(file);
          setLocal({ file, url, duration: null });
          stopStream();
          setCameraOverlay(false);
        });
      });
    } catch (e) {
      console.error('Capture failed', e);
      setError('Capture failed. Try again.');
    }
  };

  const handleStop = async () => {
    if (mediaKind === 'video') stopRecording();
    else stopStream();
    setCameraOverlay(false);
    setIsRecording(false);
  };

  const discardMedia = () => {
    stopStream();
    setLocal(null);
    setError(null);
    setIsRecording(false);
  };

  const handleUpload = async () => {
    if (!local || !local.file) return setError('No media selected');
    console.log('Uploading file:', local.file.name, 'Type:', local.file.type, 'Size:', local.file.size);
    
    if (mediaKind === 'video') {
      // try to get duration if possible
      if (!local.duration) {
        // create temp video element to measure
        const tempVideo = document.createElement('video');
        const url = local.url;
        tempVideo.src = url;
        try {
          await new Promise((resolve, reject) => {
            tempVideo.onloadedmetadata = () => resolve();
            tempVideo.onerror = () => reject(new Error('Failed to read video metadata'));
            setTimeout(() => reject(new Error('Timeout reading video')), 5000);
          });
          const d = Math.round(tempVideo.duration);
          console.log('Video duration:', d);
          setLocal(prev => ({ ...prev, duration: d }));
          if (d < 5 || d > 60) return setError('Video duration must be between 5 and 60 seconds');
        } catch (e) {
          console.error('Failed to read video duration', e);
          return setError('Failed to read video duration; try re-recording or uploading a different file');
        }
      } else {
        console.log('Duration already set:', local.duration);
        if (local.duration < 5 || local.duration > 60) return setError('Video duration must be between 5 and 60 seconds');
      }
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('media', local.file);
    formData.append('title', title);
    formData.append('caption', caption);

    console.log('FormData file object:', {
      name: local.file.name,
      type: local.file.type,
      size: local.file.size,
      lastModified: local.file.lastModified
    });

    try {
      const res = await createPost(formData);
      console.log('Upload success:', res.data);
      setUploading(false);
      setCelebrate(true);
      await new Promise(resolve => setTimeout(resolve, 2200));
      navigate('/home');
    } catch (err) {
      console.error('Upload error:', err);
      console.error('Error response:', err?.response?.data);
      setError(err?.response?.data?.error || 'Upload failed');
      setUploading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-100 pt-16 pb-16 flex flex-col items-center">
        <div className="bg-white rounded-md shadow-md p-6 w-full max-w-md mt-8">
          {!composerOpen ? (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold">Let's make a post</h2>
              <p className="text-sm text-gray-600">Pick how you want to add your media.</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setSource('upload'); setComposerOpen(true); }}
                  className="px-4 py-2 rounded bg-blue-600 text-white"
                >
                  Upload from device
                </button>
                <button
                  onClick={() => { setSource('camera'); setComposerOpen(true); startCamera(); }}
                  className="px-4 py-2 rounded bg-green-600 text-white"
                >
                  Use camera (fullscreen)
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-4">Create Post</h2>

              <div className="flex gap-2 mb-3">
                <button onClick={() => setMediaKind('video')} className={`px-3 py-1 rounded ${mediaKind === 'video' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Video</button>
                <button onClick={() => setMediaKind('image')} className={`px-3 py-1 rounded ${mediaKind === 'image' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Photo</button>
                <div className="ml-auto flex gap-2">
                  <button onClick={() => setSource('upload')} className={`px-3 py-1 rounded ${source === 'upload' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Upload</button>
                  <button onClick={() => { setSource('camera'); startCamera(); }} className={`px-3 py-1 rounded ${source === 'camera' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Camera</button>
                </div>
              </div>

              {source === 'upload' ? (
                <input type="file" accept={mediaKind === 'video' ? 'video/*' : 'image/*'} onChange={handleFileChange} />
              ) : (
                <div className="text-sm text-gray-600">Camera opens full screen when started.</div>
              )}

              {local && (
                <div className="mt-4">
                  {local.url && mediaKind === 'image' ? (
                    <img src={local.url} className="w-full rounded" alt="preview" />
                  ) : local.url ? (
                    <video ref={videoRef} src={local.url} controls onLoadedMetadata={onLoadedMetadata} className="w-full rounded" />
                  ) : null}

                  {local.duration !== null && <p className="text-sm text-gray-600 mt-2">Duration: {local.duration}s</p>}

                  <div className="mt-3 flex gap-2">
                    <button onClick={discardMedia} className="px-3 py-2 rounded bg-gray-200">Discard</button>
                    {source === 'camera' && (
                      <button onClick={startCamera} className="px-3 py-2 rounded bg-blue-500 text-white">Retake</button>
                    )}
                  </div>
                </div>
              )}

              <input
                type="text"
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-4 border rounded px-3 py-2 text-sm"
              />

              <textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full mt-4 border rounded px-3 py-2 text-sm"
              />

              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

              <div className="flex gap-2 mt-4">
                <button onClick={handleUpload} disabled={uploading} className="bg-green-500 text-white px-4 py-2 rounded">
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
                <button
                  onClick={() => {
                    stopStream();
                    setLocal(null);
                    setError(null);
                    setComposerOpen(false);
                    setSource('upload');
                  }}
                  className="bg-gray-200 px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Fullscreen Camera Overlay */}
      {cameraOverlay && (
        <div
          className="fixed inset-0 bg-black z-50 flex flex-col overflow-y-auto p-2 md:p-4"
          style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="relative bg-black w-full max-w-4xl mx-auto flex items-center justify-center aspect-[3/4] max-h-[55vh] min-h-[240px] px-4 pt-6 overflow-hidden rounded-md">
            <video
              ref={cameraVideoRef}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              muted
              controls={false}
              style={{ filter: appliedFilter }}
            />
            <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs">
              {isRecording ? 'Recording…' : 'Ready'}
            </div>
            {!streamRef.current && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-sm bg-black/60">
                Starting camera…
              </div>
            )}
            {streamRef.current && cameraVideoRef.current && cameraVideoRef.current.readyState < 2 && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-sm bg-black/40">
                Loading preview…
              </div>
            )}
            {cameraStats && (
              <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[11px] px-2 py-1 rounded">
                rs:{cameraStats.readyState} {cameraStats.videoWidth}x{cameraStats.videoHeight} {cameraStats.paused ? 'paused' : 'playing'}
              </div>
            )}
            {isRecording && (
              <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-600/80 text-white px-3 py-1 rounded-full text-xs">
                <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
                REC
              </div>
            )}
          </div>

          <div className="bg-black/80 text-white p-4 space-y-4 shadow-inner mt-3 rounded-md">
            <div className="flex justify-center gap-2 flex-wrap">
              {['none', 'vivid', 'mono', 'warm', 'cool'].map((f) => (
                <button
                  key={f}
                  onClick={() => setCameraFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs border ${cameraFilter === f ? 'bg-white text-black border-white' : 'border-white/40'}`}
                >
                  {f === 'none' ? 'No filter' : f}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => setMediaKind('image')}
                className={`px-3 py-1 rounded-full text-sm ${mediaKind === 'image' ? 'bg-white text-black' : 'bg-white/10'}`}
              >
                Photo
              </button>
              {mediaKind === 'video' ? (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-16 h-16 rounded-full border-4 ${isRecording ? 'border-red-500 bg-red-500/80' : 'border-white bg-white/10'}`}
                />
              ) : (
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full border-4 border-white bg-white/10"
                />
              )}
              <button
                onClick={() => setMediaKind('video')}
                className={`px-3 py-1 rounded-full text-sm ${mediaKind === 'video' ? 'bg-white text-black' : 'bg-white/10'}`}
              >
                Video
              </button>
            </div>

            <div className="flex justify-center gap-2 flex-wrap">
              <button onClick={handleStop} className="px-4 py-2 rounded bg-gray-700">Close</button>
              {!isRecording && (
                <button onClick={startCamera} className="px-4 py-2 rounded bg-blue-600">Restart camera</button>
              )}
            </div>
            <div className="text-center text-xs text-white/70 select-none">Scroll to reach controls if hidden</div>
          </div>
        </div>
      )}

      <Navbar />
      {celebrate && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
          <style>{`
            @keyframes glitterFall { 0% {transform: translate3d(var(--x), -10%, 0) rotate(0deg);} 100% {transform: translate3d(calc(var(--x) + 10px), 110%, 0) rotate(340deg);} }
            @keyframes glitterPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
            @keyframes popIn { 0% { transform: scale(0.7); opacity: 0; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
            @keyframes fireworkLaunch { 0% { transform: translateY(100%) scale(0.4); opacity: 0; } 40% { opacity: 1; } 70% { transform: translateY(-20%) scale(1); opacity: 1; } 100% { transform: translateY(-120%) scale(1.05); opacity: 0; } }
            @keyframes fireworkBurst { 0% { transform: scale(0); opacity: 1; } 60% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.3); opacity: 0; } }
            @keyframes spark { 0% { transform: translate(-50%, -50%) scale(0.4); opacity: 1; } 70% { opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0; } }
          `}</style>
          <div className="absolute inset-0">
            {[...Array(90)].map((_, i) => {
              const left = Math.random() * 100;
              const size = 6 + Math.random() * 6;
              const duration = 1 + Math.random();
              const delay = Math.random() * 0.5;
              const colors = ['#fbbf24', '#f472b6', '#60a5fa', '#34d399', '#c084fc'];
              const color = colors[i % colors.length];
              return (
                <span
                  key={i}
                  style={{
                    '--x': `${left}%`,
                    left: `${left}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    background: color,
                    opacity: 0.9,
                    position: 'absolute',
                    top: '-5%',
                    borderRadius: '9999px',
                    animation: `glitterFall ${duration}s ease-in forwards, glitterPulse 1s ease-in-out ${delay}s infinite`,
                  }}
                />
              );
            })}
          </div>
          {[{ left: '38%' }, { left: '52%' }, { left: '66%' }].map((pos, idx) => (
            <div key={idx} className="absolute bottom-0" style={{ left: pos.left, width: '6px', height: '200px' }}>
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2"
                style={{ width: '8px', height: '80px', background: '#fbbf24', borderRadius: '9999px', animation: 'fireworkLaunch 1s ease-out' }}
              />
              <div
                className="absolute"
                style={{
                  top: '-60px', left: '-60px', width: '120px', height: '120px',
                  borderRadius: '9999px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.95), rgba(251,191,36,0.6), rgba(244,114,182,0.3))',
                  animation: 'fireworkBurst 1.1s ease-out',
                }}
              />
              {[...Array(10)].map((_, sIdx) => {
                const angle = (sIdx / 10) * Math.PI * 2;
                const dist = 45;
                return (
                  <span
                    key={sIdx}
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '-10px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transformOrigin: 'center',
                      transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`,
                      animation: 'spark 1.1s ease-out',
                    }}
                  />
                );
              })}
            </div>
          ))}
          <div className="relative bg-black/80 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg" style={{ animation: 'popIn 0.3s ease-out' }}>
            Post uploaded! 🎆
          </div>
        </div>
      )}
    </>
  );
}
