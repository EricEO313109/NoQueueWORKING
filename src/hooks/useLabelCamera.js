import { useCallback, useEffect, useRef, useState } from 'react';

const CONSTRAINTS = [
  { video: { facingMode: 'environment' }, audio: false },
  { video: { facingMode: { ideal: 'environment' } }, audio: false },
  { video: true, audio: false },
];

export function useLabelCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks?.().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    stop();
    try {
      let stream;
      for (const c of CONSTRAINTS) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(c);
          break;
        } catch { /* next */ }
      }
      if (!stream) throw new Error('Camera indisponibilă');

      const video = videoRef.current;
      if (!video) throw new Error('Camera indisponibilă');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.muted = true;
      await video.play();
      streamRef.current = stream;
      setCameraReady(true);
    } catch (e) {
      setError(e?.name === 'NotAllowedError'
        ? 'Permite accesul la cameră.'
        : e?.message || 'Camera indisponibilă');
    }
  }, [stop]);

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.92);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { videoRef, error, cameraReady, startCamera, capturePhoto, stopCamera: stop };
}
