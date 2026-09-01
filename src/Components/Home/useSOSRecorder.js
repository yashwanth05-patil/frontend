import { useCallback, useRef, useState } from 'react';
import api from '../../../API/CustomApi';
import { Config } from '../../../API/Config';

// Records a short audio+video clip from the device camera/mic and uploads it.
//
// Design notes (kept simple on purpose for a review-stage build):
// - Recording is capped at MAX_DURATION_MS so a triggered SOS can't run
//   forever in the background and drain battery/data if nobody stops it.
// - If camera access fails or is denied, we fall back to audio-only rather
//   than failing the whole SOS flow - some evidence beats none.
// - The clip uploads as a single blob once recording stops, not chunked
//   mid-recording. That keeps the upload path (and the backend endpoint)
//   simple, at the cost of losing the clip if the device is destroyed
//   mid-recording. A chunked/streaming version is future-scope work.
const MAX_DURATION_MS = 30_000;

export function useSOSRecorder() {
  const [status, setStatus] = useState('idle'); // idle | recording | uploading | done | error
  const [evidenceUrl, setEvidenceUrl] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timeoutRef = useRef(null);

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const uploadClip = useCallback(async (blob, mediaType, userId) => {
    setStatus('uploading');
    try {
      const formData = new FormData();
      const ext = mediaType === 'audio' ? 'webm' : 'webm';
      formData.append('media', blob, `sos-evidence.${ext}`);
      formData.append('userId', userId);
      formData.append('type', mediaType);

      const { data } = await api.post(Config.UPLOADEVIDENCEUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setEvidenceUrl(data.url);
      setStatus('done');
      return data.url;
    } catch (err) {
      console.error('Evidence upload failed:', err);
      setError(err.message || 'Upload failed');
      setStatus('error');
      return null;
    }
  }, []);

  // Starts recording. Returns a promise that resolves with the uploaded
  // evidence URL once the clip is captured and uploaded (or null on failure).
  const startRecording = useCallback(
    (userId) => {
      return new Promise(async (resolve) => {
        setError(null);
        setEvidenceUrl(null);
        chunksRef.current = [];

        let stream;
        let mediaType = 'video';

        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (videoErr) {
          console.warn('Camera unavailable, falling back to audio-only:', videoErr.message);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaType = 'audio';
          } catch (audioErr) {
            console.error('Microphone also unavailable:', audioErr.message);
            setError('Camera and microphone permission denied or unavailable');
            setStatus('error');
            resolve(null);
            return;
          }
        }

        streamRef.current = stream;

        const mimeType = mediaType === 'video'
          ? (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' : 'video/webm')
          : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '');

        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          cleanupStream();
          clearTimeout(timeoutRef.current);
          const blob = new Blob(chunksRef.current, { type: mediaType === 'video' ? 'video/webm' : 'audio/webm' });
          const url = await uploadClip(blob, mediaType, userId);
          resolve(url);
        };

        recorder.start();
        setStatus('recording');

        // Auto-stop safety net so a forgotten recording doesn't run forever.
        timeoutRef.current = setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }, MAX_DURATION_MS);
      });
    },
    [uploadClip]
  );

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Aborts an in-progress recording without uploading the partial clip.
  // Used by the Guardian Dial's Cancel action so the user can back out of
  // a live SOS they armed by mistake.
  const abortRecording = useCallback(() => {
    clearTimeout(timeoutRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.onstop = null;
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // recorder may already be stopping - ignore
      }
    }
    chunksRef.current = [];
    cleanupStream();
    setEvidenceUrl(null);
    setError(null);
    setStatus('idle');
  }, []);

  return { status, evidenceUrl, error, startRecording, stopRecording, abortRecording, maxDurationMs: MAX_DURATION_MS };
}
