import { useCallback, useRef, useState } from 'react';
import api from '../../../API/CustomApi';
import { Config } from '../../../API/Config';

// Manages the "share my location" lifecycle, WhatsApp-style:
//   'once'     - a single snapshot, no ongoing updates, no live page needed
//   '15min' / '30min' - live sharing that auto-stops after the chosen time
//   'untilOff' - live sharing with no time limit, stops only when the user
//                taps Stop
//
// Design notes (worth knowing, not hiding):
// - "Live" here means the browser tab pushes a fresh position to the server
//   every UPDATE_INTERVAL_MS while the mode is active. Like the voice
//   activation feature, this only works while the tab stays open (foreground
//   or backgrounded) - a fully closed browser/tab stops updating, same
//   platform limit as everything else built on web APIs rather than a
//   native app.
// - The viewer's page polls the server for the latest position rather than
//   using a live socket connection - simpler to build and reason about for
//   a review-stage project, at the cost of a few seconds of lag rather than
//   instant push updates.
const UPDATE_INTERVAL_MS = 8000;

export function useLiveLocationShare() {
  const [status, setStatus] = useState('idle'); // idle | active | error
  const [mode, setMode] = useState(null);
  const [shareId, setShareId] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [error, setError] = useState(null);

  const watchIdRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const lastPositionRef = useRef(null);

  const getCurrentPosition = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not available in this browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      });
    });

  const stopWatching = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    clearInterval(updateIntervalRef.current);
    updateIntervalRef.current = null;
  };

  const pushUpdate = useCallback(async (currentShareId) => {
    const pos = lastPositionRef.current;
    if (!pos || !currentShareId) return;
    try {
      await api.post(Config.LOCATIONUPDATEUrl, {
        shareId: currentShareId,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
    } catch (err) {
      // A single missed update isn't fatal - the next tick tries again.
      // If the share expired/was stopped server-side, stop trying.
      if (err.response?.status === 410) {
        stopWatching();
        setStatus('idle');
        setMode(null);
      }
    }
  }, []);

  const startSharing = useCallback(
    async (userId, senderName, selectedMode) => {
      setError(null);
      try {
        const position = await getCurrentPosition();
        lastPositionRef.current = position;

        const { data } = await api.post(Config.LOCATIONSTARTUrl, {
          userId,
          senderName,
          mode: selectedMode,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        setShareId(data.shareId);
        setMode(selectedMode);
        setExpiresAt(data.expiresAt);
        setStatus('active');

        if (selectedMode === 'once') {
          // One-time snapshot - nothing further to do, no live tracking.
          return { shareId: data.shareId, mode: selectedMode };
        }

        // Live modes: watch position continuously, but only actually POST
        // to the server on a fixed interval (not on every GPS tick) to
        // avoid hammering the backend.
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            lastPositionRef.current = pos;
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 5000 }
        );

        updateIntervalRef.current = setInterval(() => pushUpdate(data.shareId), UPDATE_INTERVAL_MS);

        return { shareId: data.shareId, mode: selectedMode };
      } catch (err) {
        console.error('Failed to start location sharing:', err);
        setError(err.message || 'Could not start sharing your location');
        setStatus('error');
        return null;
      }
    },
    [pushUpdate]
  );

  const stopSharing = useCallback(async () => {
    stopWatching();
    if (shareId) {
      try {
        await api.post(Config.LOCATIONSTOPUrl, { shareId });
      } catch (err) {
        console.error('Failed to stop sharing on server:', err);
      }
    }
    setStatus('idle');
    setMode(null);
    setShareId(null);
    setExpiresAt(null);
  }, [shareId]);

  return { status, mode, shareId, expiresAt, error, startSharing, stopSharing };
}
