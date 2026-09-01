import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import BottomNav from "./Home/BottomNav";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Amber pulsing location marker — the "you are here" instrument dot.
const locationIcon = L.divIcon({
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: `
    <div style="position: relative; width: 22px; height: 22px;">
      <span style="position:absolute; inset:0; border-radius:9999px; background:rgba(232,163,61,0.35); animation:guardian-map-ping 1.8s ease-out infinite;"></span>
      <span style="position:absolute; left:4px; top:4px; width:14px; height:14px; border-radius:9999px; border:2px solid #0B1220; background:#E8A33D;"></span>
    </div>
  `,
});

const TrackMeMap = () => {
  const [currentPosition, setCurrentPosition] = useState([19.0760, 72.8777]);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [fixMeta, setFixMeta] = useState({ accuracy: null, method: null });
  const mapRef = useRef(null);

  const getIPBasedLocation = async () => {
    try {
      let response = await fetch('https://ipapi.co/json/');
      if (!response.ok) throw new Error('First IP API failed');

      const data = await response.json();
      if (data.latitude && data.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 50000,
          method: 'ipapi'
        };
      }

      response = await fetch('https://ipwho.is/');
      if (!response.ok) throw new Error('Second IP API failed');

      const fallbackData = await response.json();
      return {
        latitude: fallbackData.latitude,
        longitude: fallbackData.longitude,
        accuracy: 50000,
        method: 'ipwhois'
      };
    } catch (error) {
      console.error('IP geolocation failed:', error);
      throw new Error('Could not determine approximate location from IP');
    }
  };

  const getLocation = async () => {
    if (navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          method: 'gps'
        };
      } catch (gpsError) {
        console.log('GPS failed, falling back to IP:', gpsError);
      }
    }

    try {
      const ipLocation = await getIPBasedLocation();
      return ipLocation;
    } catch (ipError) {
      console.error('All location methods failed:', ipError);
      throw new Error('Could not determine your location');
    }
  };

  const handleTrackMe = async () => {
    if (!isTracking) {
      const location = await getLocation()
      const newLocation = [location.latitude, location.longitude]
      setCurrentPosition(newLocation);
      setFixMeta({
        accuracy: location.accuracy ? Math.round(location.accuracy) : null,
        method: location.method,
      });
      if (mapRef.current) {
        mapRef.current.setView(newLocation, 15);
      }
      setIsTracking(true);
    } else {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      setIsTracking(false);
      setWatchId(null);
    }
  };

  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <div className="page-shell flex flex-col min-h-[calc(100vh-72px)]">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <div className="card-surface px-4 py-2.5 mb-4">
          <p className="mono-readout text-center">
            {isTracking
              ? `FIX ${fixMeta.method === 'gps' ? 'GPS' : 'APPROX'} · ACCURACY ${fixMeta.accuracy ? `${fixMeta.accuracy}m` : '—'}`
              : 'TRACKING STANDBY'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleTrackMe}
          className={`${isTracking ? 'btn-secondary' : 'btn-primary'} w-full sm:w-auto self-center mb-4`}
        >
          {isTracking ? 'Stop tracking' : 'Track me'}
        </button>

        <div className="flex-1 min-h-[52vh] relative rounded-card overflow-hidden border border-slate">
          <MapContainer
            center={currentPosition}
            zoom={15}
            className="h-full w-full min-h-[52vh]"
            whenCreated={map => mapRef.current = map}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <Marker position={currentPosition} icon={locationIcon}>
              <Popup>You are here</Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default TrackMeMap;
