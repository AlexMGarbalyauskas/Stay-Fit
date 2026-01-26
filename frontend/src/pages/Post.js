import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import api, { createPost } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { Upload, Camera, Video, Image as ImageIcon, Sparkles } from 'lucide-react';

export default function Post() {
  const { t } = useLanguage();
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
  const canvasRef = useRef(null);

  const navigate = useNavigate();

  // Canvas fireworks animation
  useEffect(() => {
    if (!celebrate || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const listFire = [];
    const listFirework = [];
    const fireNumber = 15;
    const center = { x: canvas.width / 2, y: canvas.height / 2 };
    const range = 150;

    // Initialize rockets
    for (let i = 0; i < fireNumber; i++) {
      const fire = {
        x: Math.random() * range / 2 - range / 4 + center.x,
        y: Math.random() * range * 2 + canvas.height,
        size: Math.random() + 1,
        fill: '#fd1',
        vx: Math.random() - 0.5,
        vy: -(Math.random() + 5),
        ax: Math.random() * 0.02 - 0.01,
        far: Math.random() * range + (center.y - range)
      };
      fire.base = { x: fire.x, y: fire.y, vx: fire.vx };
      listFire.push(fire);
    }

    const randColor = () => {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      return `rgb(${r}, ${g}, ${b})`;
    };

    const update = () => {
      for (let i = 0; i < listFire.length; i++) {
        const fire = listFire[i];
        if (fire.y <= fire.far) {
          const color = randColor();
          for (let j = 0; j < fireNumber * 8; j++) {
            const firework = {
              x: fire.x,
              y: fire.y,
              size: Math.random() * 3 + 2.5,
              fill: color,
              vx: Math.random() * 8 - 4,
              vy: Math.random() * -8 + 2,
              ay: 0.04,
              alpha: 1,
              life: Math.round(Math.random() * range) + range
            };
            firework.base = { life: firework.life, size: firework.size };
            listFirework.push(firework);
          }
          fire.y = fire.base.y;
          fire.x = fire.base.x;
          fire.vx = fire.base.vx;
          fire.ax = Math.random() * 0.02 - 0.01;
        }
        fire.x += fire.vx;
        fire.y += fire.vy;
        fire.vx += fire.ax;
      }

      for (let i = listFirework.length - 1; i >= 0; i--) {
        const firework = listFirework[i];
        if (firework) {
          firework.x += firework.vx;
          firework.y += firework.vy;
          firework.vy += firework.ay;
          firework.alpha = firework.life / firework.base.life;
          firework.size = firework.alpha * firework.base.size;
          firework.alpha = firework.alpha > 0.6 ? 1 : firework.alpha;
          firework.life--;
          if (firework.life <= 0) {
            listFirework.splice(i, 1);
          }
        }
      }
    };

    const draw = () => {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 1;
      for (let i = 0; i < listFire.length; i++) {
        const fire = listFire[i];
        ctx.beginPath();
        ctx.arc(fire.x, fire.y, fire.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = fire.fill;
        ctx.fill();
      }

      for (let i = 0; i < listFirework.length; i++) {
        const firework = listFirework[i];
        ctx.globalAlpha = firework.alpha;
        ctx.beginPath();
        ctx.arc(firework.x, firework.y, firework.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = firework.fill;
        ctx.fill();
      }
    };

    let animationId;
    const loop = () => {
      update();
      draw();
      animationId = requestAnimationFrame(loop);
    };

    loop();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [celebrate]);

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
      await new Promise(resolve => setTimeout(resolve, 4500));
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

      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-16 pb-16 flex flex-col items-center px-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-lg mt-12 border border-white/20">
          {!composerOpen ? (
            <div className="text-center space-y-6">
              {/* Icon header */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-xl opacity-60 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 tracking-widest">
                  {t('chooseMediaType')}
                </h2>
                <p className="text-gray-600 text-lg">{t('chooseSource')}</p>
              </div>

              <div className="flex flex-col gap-4 pt-2">
                <button
                  onClick={() => { setSource('upload'); setComposerOpen(true); }}
                  className="group relative overflow-hidden px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <div className="relative flex items-center justify-center gap-3">
                    <Upload className="w-5 h-5" />
                    <span className="font-semibold">{t('uploadFromDevice')}</span>
                  </div>
                </button>
                
                <button
                  onClick={() => { setSource('camera'); setComposerOpen(true); startCamera(); }}
                  className="group relative overflow-hidden px-6 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <div className="relative flex items-center justify-center gap-3">
                    <Camera className="w-5 h-5" />
                    <span className="font-semibold">{t('useCamera')}</span>
                  </div>
                </button>
              </div>

              <div className="pt-4 text-xs text-gray-500 flex items-center justify-center gap-2">
                <Video className="w-4 h-4" />
                <span>Share videos (5-60s) or photos</span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t('createPost')}</h2>
              </div>

              <div className="flex gap-2 mb-4 flex-wrap">
                <button 
                  onClick={() => setMediaKind('video')} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${mediaKind === 'video' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <Video className="w-4 h-4" />
                  {t('video')}
                </button>
                <button 
                  onClick={() => setMediaKind('image')} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${mediaKind === 'image' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <ImageIcon className="w-4 h-4" />
                  {t('photo')}
                </button>
                <div className="ml-auto flex gap-2">
                  <button 
                    onClick={() => setSource('upload')} 
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${source === 'upload' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    <Upload className="w-4 h-4" />
                    {t('upload')}
                  </button>
                  <button 
                    onClick={() => { setSource('camera'); startCamera(); }} 
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${source === 'camera' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    <Camera className="w-4 h-4" />
                    {t('camera')}
                  </button>
                </div>
              </div>

              {source === 'upload' ? (
                <div className="mb-4">
                  <label className="block w-full">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-1">Click to select {mediaKind === 'video' ? 'video' : 'photo'}</p>
                      <p className="text-xs text-gray-400">or drag and drop here</p>
                    </div>
                    <input 
                      type="file" 
                      accept={mediaKind === 'video' ? 'video/*' : 'image/*'} 
                      onChange={handleFileChange} 
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Camera className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <p className="font-medium text-green-700 mb-1">Camera mode active</p>
                      <p className="text-gray-600">Full-screen camera will open when you're ready to capture.</p>
                    </div>
                  </div>
                </div>
              )}

              {local && (
                <div className="mt-4">
                  {local.url && mediaKind === 'image' ? (
                    <img src={local.url} className="w-full rounded" alt="preview" />
                  ) : local.url ? (
                    <video ref={videoRef} src={local.url} controls onLoadedMetadata={onLoadedMetadata} className="w-full rounded" />
                  ) : null}

                  {local.duration !== null && <p className="text-sm text-gray-600 mt-2">{t('duration')}: {local.duration}s</p>}

                  <div className="mt-3 flex gap-2">
                    <button onClick={discardMedia} className="px-3 py-2 rounded bg-gray-200">{t('discard')}</button>
                    {source === 'camera' && (
                      <button onClick={startCamera} className="px-3 py-2 rounded bg-blue-500 text-white">{t('retake')}</button>
                    )}
                  </div>
                </div>
              )}

              <input
                type="text"
                placeholder={t('title')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-4 border rounded px-3 py-2 text-sm"
              />

              <textarea
                placeholder={t('writeCaption')}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full mt-4 border rounded px-3 py-2 text-sm"
              />

              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={handleUpload} 
                  disabled={uploading} 
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('uploading')}
                    </span>
                  ) : t('upload')}
                </button>
                <button
                  onClick={() => {
                    stopStream();
                    setLocal(null);
                    setError(null);
                    setComposerOpen(false);
                    setSource('upload');
                  }}
                  className="px-6 py-3 rounded-xl font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                >
                  {t('cancel')}
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
        <div className="pointer-events-none fixed inset-0 z-50">
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full"
            style={{ display: 'block' }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-2xl" style={{ animation: 'popIn 0.5s ease-out', textShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
              <style>{`
                @keyframes popIn { 0% { transform: scale(0.7); opacity: 0; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
              `}</style>
              Post uploaded!
            </div>
          </div>
        </div>
      )}
    </>
  );
}
