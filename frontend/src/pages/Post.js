import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import api, { createPost } from '../api';

export default function Post() {
  const [mediaKind, setMediaKind] = useState('video'); // 'video' or 'image'
  const [source, setSource] = useState('upload'); // 'upload' or 'camera'

  const [local, setLocal] = useState(null); // { file, url, duration }
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const videoRef = useRef(); // used for both preview and camera stream
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordTimerRef = useRef(null);

  const navigate = useNavigate();

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
      const constraints = { video: true, audio: mediaKind === 'video' };
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;

      if (mediaKind === 'video') {
        // prepare recorder
        recordedChunksRef.current = [];
        const options = { mimeType: 'video/webm;codecs=vp9' };
        const mr = new MediaRecorder(s, options);
        recorderRef.current = mr;
        mr.ondataavailable = (e) => { if (e.data && e.data.size) recordedChunksRef.current.push(e.data); };
        mr.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          console.log('Camera blob type:', blob.type);
          const file = new File([blob], `recording_${Date.now()}.webm`, { type: 'video/webm' });
          console.log('Camera file type:', file.type);
          const url = URL.createObjectURL(file);
          setLocal({ file, url, duration: null });
          // stop stream
          stopStream();
        };
        mr.start();
        // auto-stop at 60s
        recordTimerRef.current = setTimeout(() => stopRecording(), 60000);
      }
    } catch (err) {
      console.error('Camera error', err);
      setError('Could not access camera. Check permissions.');
    }
  };

  const stopStream = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    } catch (e) {}
  };

  const stopRecording = () => {
    try { clearTimeout(recordTimerRef.current); } catch (e) {}
    try { recorderRef.current && recorderRef.current.state !== 'inactive' && recorderRef.current.stop(); } catch (e) {}
  };

  const capturePhoto = () => {
    if (!videoRef.current) return setError('Camera not started');
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      const file = new File([blob], `photo_${Date.now()}.png`, { type: 'image/png' });
      const url = URL.createObjectURL(file);
      setLocal({ file, url, duration: null });
      stopStream();
    });
  };

  const handleStart = async () => {
    setError(null);
    if (source === 'camera') {
      await startCamera();
    }
  };

  const handleStop = async () => {
    if (mediaKind === 'video') stopRecording();
    else stopStream();
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
          <h2 className="text-xl font-bold mb-4">Create Post</h2>

          <div className="flex gap-2 mb-3">
            <button onClick={() => setMediaKind('video')} className={`px-3 py-1 rounded ${mediaKind === 'video' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Video</button>
            <button onClick={() => setMediaKind('image')} className={`px-3 py-1 rounded ${mediaKind === 'image' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Photo</button>
            <div className="ml-auto flex gap-2">
              <button onClick={() => setSource('upload')} className={`px-3 py-1 rounded ${source === 'upload' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Upload</button>
              <button onClick={() => setSource('camera')} className={`px-3 py-1 rounded ${source === 'camera' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Camera</button>
            </div>
          </div>

          {source === 'upload' ? (
            <input type="file" accept={mediaKind === 'video' ? 'video/*' : 'image/*'} onChange={handleFileChange} />
          ) : (
            <div>
              <div className="mb-2">
                <video ref={videoRef} className="w-full rounded bg-black" autoPlay playsInline muted={mediaKind === 'image'} controls={false} />
              </div>
              <div className="flex gap-2">
                {mediaKind === 'video' ? (
                  <>
                    <button onClick={handleStart} className="px-3 py-1 rounded bg-yellow-500 text-white">Start Recording</button>
                    <button onClick={handleStop} className="px-3 py-1 rounded bg-red-500 text-white">Stop Recording</button>
                  </>
                ) : (
                  <>
                    <button onClick={handleStart} className="px-3 py-1 rounded bg-yellow-500 text-white">Open Camera</button>
                    <button onClick={capturePhoto} className="px-3 py-1 rounded bg-blue-500 text-white">Capture Photo</button>
                  </>
                )}
                <button onClick={stopStream} className="px-3 py-1 rounded bg-gray-200">Close</button>
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

              {local.duration !== null && <p className="text-sm text-gray-600 mt-2">Duration: {local.duration}s</p>}
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
            <button onClick={() => { stopStream(); navigate('/home'); }} className="bg-gray-200 px-4 py-2 rounded">
              Cancel
            </button>
          </div>
        </div>
      </main>

      <Navbar />
    </>
  );
}
