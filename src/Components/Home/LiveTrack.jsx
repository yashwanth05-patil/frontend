import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Config } from '../../../API/Config';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Public page - anyone with the link can open this, no login required.
// It only ever displays what the backend's public GetLocationShare endpoint
// returns: a name, a position, and a status. Nothing else about the
// sharer's account is ever sent to or shown on this page.
const POLL_INTERVAL_MS = 5000;

function timeAgo(isoString) {
  if (!isoString) return '';
  const seconds = Math.round((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}

function LiveTrack() {
  const { shareId } = useParams();
  const [share, setShare] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const fetchShare = async () => {
      try {
        const res = await fetch(`${Config.LOCATIONVIEWBaseUrl}/${shareId}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'This link is invalid or has expired');
        }
        const data = await res.json();
        if (!cancelled) {
          setShare(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    };

    fetchShare();
    pollRef.current = setInterval(fetchShare, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(pollRef.current);
    };
  }, [shareId]);

  // Once a share stops being active (expired, stopped, or was a one-time
  // snapshot), there's nothing left to poll for - stop hitting the server.
  useEffect(() => {
    if (share && !share.active) {
      clearInterval(pollRef.current);
    }
  }, [share]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-4">
        <div className="card-surface p-6 max-w-sm text-center">
          <p className="text-heading text-ink mb-2">Link unavailable</p>
          <p className="text-body text-ink-soft">{error}</p>
        </div>
      </div>
    );
  }

  if (!share) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <p className="text-body text-ink-soft">Loading location…</p>
      </div>
    );
  }

  const position = [share.latitude, share.longitude];

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <div className="card-surface m-3 p-4">
        <p className="text-heading text-ink">{share.senderName}'s location</p>
        <p className="mono-readout mt-1">
          {share.active
            ? `LIVE · UPDATED ${timeAgo(share.updatedAt).toUpperCase()}`
            : share.mode === 'once'
              ? 'LOCATION SHARED · ONE-TIME'
              : 'SHARING HAS ENDED'}
        </p>
        {share.accuracy && (
          <p className="text-caption text-ink-soft mt-1">Accuracy ~{Math.round(share.accuracy)}m</p>
        )}
      </div>

      <div className="flex-1 min-h-[60vh]">
        <MapContainer center={position} zoom={16} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <Marker position={position}>
            <Popup>{share.senderName}</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}

export default LiveTrack;
