import React, { useContext, useEffect, useMemo, useState } from 'react';
import GuardianDial from '../GuardianDial';
import { Plus, X, Mic, MicOff, StopCircle } from 'lucide-react';
import BottomNav from './BottomNav';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../../Context/AuthContext';
import api from '../../../API/CustomApi';
import { Config } from '../../../API/Config';
import Loader from './Loader';
import { toast } from "react-toastify"
import { useSOSRecorder } from './useSOSRecorder';
import { useVoiceActivation } from './useVoiceActivation';

function formatClock(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function AfterLogin() {
  const [showAddContact, setShowAddContact] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const { handleSubmit, register, reset } = useForm();
  const { user, setUser } = useContext(AuthContext);
  const [contactsdata, setContactsdata] = useState([]);
  const [showLoader, setShowLoader] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [accuracyM, setAccuracyM] = useState(null);
  const [clock, setClock] = useState(() => formatClock(new Date()));
  const [alertActive, setAlertActive] = useState(false);

  const { status: recordingStatus, startRecording, stopRecording, maxDurationMs } = useSOSRecorder();

  const sendEvidenceLink = async (evidenceUrl) => {
    if (!evidenceUrl || !contactsdata || contactsdata.length === 0) return;
    try {
      const { data } = await api.post(Config.SENDEVIDENCEUrl, {
        contacts: contactsdata,
        evidenceUrl,
        senderName: user?.username || 'Someone',
      });

      const results = data?.emailResults || [];
      const failures = results.filter((r) => r.status === 'failed');

      if (results.length === 0) {
        toast.warn('No contact has an email on file, so no evidence link was sent');
      } else if (failures.length === results.length) {
        console.error('Evidence email failures:', failures);
        toast.error('Evidence link failed to send — check backend logs for the reason');
      } else if (failures.length > 0) {
        console.error('Some evidence email failures:', failures);
        toast.warn(`Evidence link sent to ${results.length - failures.length}/${results.length} contacts`);
      } else {
        toast.success('Evidence clip sent to your Trusted Circle');
      }
    } catch (error) {
      console.error('Error sending evidence link:', error);
      toast.error('Alert sent, but the evidence link could not be emailed');
    }
  };

  const {
    isSupported: voiceSupported,
    isListening: voiceListening,
    stage: voiceStage,
    micError: voiceError,
    startListening: startVoiceActivation,
    stopListening: stopVoiceActivation,
    wasEnabledBefore,
  } = useVoiceActivation(() => {
    toast.info('Voice command heard — sending alert');
    handleSOS();
  });

  useEffect(() => {
    if (wasEnabledBefore && voiceSupported) {
      startVoiceActivation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setContactsdata(Array.isArray(user?.contacts) ? user.contacts : []);
  }, [user]);

  useEffect(() => {
    const id = setInterval(() => setClock(formatClock(new Date())), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return undefined;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (position.coords.accuracy) {
          setAccuracyM(Math.round(position.coords.accuracy));
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    if (recordingStatus === 'idle' || recordingStatus === 'done' || recordingStatus === 'error') {
      const timer = setTimeout(() => setAlertActive(false), recordingStatus === 'idle' ? 0 : 1800);
      return () => clearTimeout(timer);
    }
    if (recordingStatus === 'recording' || recordingStatus === 'uploading') {
      setAlertActive(true);
    }
  }, [recordingStatus]);

  const Submit = async (formData) => {
    setShowLoader(true);
    try {
      const contactData = new FormData();
      contactData.append('photo', formData.photo[0]);
      contactData.append('name', formData.name);
      contactData.append('MobileNo', formData.MobileNo);
      contactData.append('email', formData.email);
      contactData.append('userId', user._id);

      const { data: responseData } = await api.post(
        Config.ContactUrl,
        contactData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (responseData) {
        const newContact = responseData.contact;
        setUser((prevUser) => ({
          ...prevUser,
          contacts: [...(prevUser.contacts || []), newContact],
        }));
        setShowAddContact(false);
        reset();
        toast.success('Added to your Trusted Circle');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Could not add this person. Try again.');
    } finally {
      setShowLoader(false);
    }
  };

  const handleDelete = async (contactId) => {
    setShowLoader(true);
    try {
      const response = await api.delete(Config.DELETECONTACTUrl, {
        params: { userId: user._id, contactId },
      });

      if (response.status === 200) {
        setContactsdata((prevContacts) =>
          prevContacts.filter((contact) => contact._id !== contactId)
        );
        setUser((prevUser) => ({
          ...prevUser,
          contacts: prevUser.contacts.filter((c) => c._id !== contactId),
        }));
        setSelectedContact(null);
        toast.success('Removed from your Trusted Circle');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Could not remove this person. Try again.');
    } finally {
      setShowLoader(false);
    }
  };

  const getLocation = async () => {
    if (navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });
        if (position.coords.accuracy) {
          setAccuracyM(Math.round(position.coords.accuracy));
        }
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } catch (gpsError) {
        console.log('GPS failed, falling back to IP');
      }
    }

    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return { latitude: data.latitude, longitude: data.longitude };
  };

  const handleSOS = async () => {
    setLocationError(null);
    setAlertActive(true);

    try {
      if (!contactsdata || contactsdata.length === 0) {
        throw new Error('Add someone to your Trusted Circle before sending an alert');
      }

      const location = await getLocation();

      await api.post(Config.EMERGENCYUrl, {
        contacts: contactsdata,
        contactNumbers: contactsdata.map((c) => c.MobileNo),
        senderName: user?.username || "Someone",
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      });

      toast.success('Alert sent to your Trusted Circle');

      toast.info('Recording an evidence clip in the background');
      startRecording(user?._id).then((evidenceUrl) => {
        if (evidenceUrl) {
          sendEvidenceLink(evidenceUrl);
        } else {
          toast.warn('Could not record evidence — camera or microphone is unavailable');
        }
      });
    } catch (error) {
      console.error('SOS Error:', error);
      setAlertActive(false);
      const message = error.message || 'Emergency alert could not be sent';
      if (message.toLowerCase().includes('location') || message.toLowerCase().includes('geolocation')) {
        setLocationError('Location permission is off. Turn it on in Settings to send your position.');
      } else {
        setLocationError(message);
      }
      toast.error(message);
    }
  };

  const ringState = useMemo(() => {
    if (alertActive || recordingStatus === 'recording' || recordingStatus === 'uploading') {
      return 'triggered';
    }
    if (voiceStage === 'armed') return 'armed';
    return 'calm';
  }, [alertActive, recordingStatus, voiceStage]);

  const dialCaption = recordingStatus === 'uploading'
    ? 'ALERT SENT · UPLOADING'
    : recordingStatus === 'recording'
      ? 'ALERT SENT · RECORDING'
      : ringState === 'armed'
        ? 'LISTENING FOR “EMERGENCY”...'
        : undefined;

  const accuracyLabel = accuracyM
    ? `ACCURACY ${accuracyM}m · ${clock}`
    : `POSITION PENDING · ${clock}`;

  return (
    <div className={`page-shell relative ${ringState === 'triggered' ? 'page-shell-alert' : ''}`}>
      <div className="mx-auto w-full max-w-lg pt-2">
        <div className="card-surface px-4 py-2.5 mb-8">
          <p className="mono-readout text-center">{accuracyLabel}</p>
        </div>

        {locationError && (
          <p className="mb-4 text-center text-caption text-dusk">{locationError}</p>
        )}

        <GuardianDial
          ringState={ringState}
          caption={dialCaption}
          onHoldComplete={handleSOS}
        />

        {recordingStatus === 'recording' && (
          <div className="mt-2 flex flex-col items-center gap-2">
            <span className="badge-signal">
              Recording · auto-stops in {Math.round(maxDurationMs / 1000)}s
            </span>
            <button type="button" onClick={stopRecording} className="btn-secondary text-caption">
              <StopCircle className="w-4 h-4" />
              Stop and send now
            </button>
          </div>
        )}

        {voiceSupported && (
          <div className="mt-6 flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={voiceListening ? stopVoiceActivation : startVoiceActivation}
              className={`inline-flex items-center gap-2 min-h-touch rounded-pill px-3.5 py-1.5 text-caption transition-colors duration-page ${
                voiceStage === 'armed'
                  ? 'bg-dusk-soft text-dusk'
                  : voiceListening
                    ? 'bg-sage-soft text-sage'
                    : 'bg-paper-raised text-ink-soft border border-slate-line'
              }`}
              title={voiceListening ? 'Turn off voice activation' : 'Enable hands-free voice activation'}
            >
              {voiceListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              {voiceStage === 'armed'
                ? 'Voice: listening for “emergency”'
                : voiceListening
                  ? 'Voice: listening for “Hey Safe”'
                  : 'Voice: off'}
            </button>
            {voiceError && (
              <p className="text-center text-caption text-dusk max-w-xs">{voiceError}</p>
            )}
          </div>
        )}

        <section className="mt-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-heading text-ink">Trusted Circle</h2>
            <span className="mono-readout">{contactsdata.length}/3</span>
          </div>

          <div className="flex items-center justify-center gap-0 min-h-[88px]">
            {contactsdata.map((contact, index) => (
              <button
                key={contact._id || index}
                type="button"
                onClick={() => setSelectedContact(contact)}
                className="relative min-h-touch min-w-touch -ml-3 first:ml-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-dusk rounded-full"
                style={{ zIndex: contactsdata.length - index }}
                aria-label={contact.name}
              >
                <img
                  className="h-16 w-16 rounded-full object-cover border-2 border-paper"
                  src={contact.photo}
                  alt=""
                />
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowAddContact(true)}
              disabled={contactsdata.length >= 3}
              className={`relative -ml-1 flex h-16 w-16 min-h-touch min-w-touch items-center justify-center rounded-full border border-dashed border-dusk text-dusk bg-dusk-soft ${
                contactsdata.length >= 3 ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              aria-label="Add to Trusted Circle"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex justify-center gap-4 flex-wrap">
            {contactsdata.map((contact) => (
              <span key={`label-${contact._id}`} className="text-caption text-ink-soft">
                {contact.name}
              </span>
            ))}
          </div>

          {contactsdata.length === 0 && (
            <p className="mt-4 text-center text-body text-ink-soft">
              No one in your Trusted Circle yet — add someone who should know if you need help.
            </p>
          )}
          {contactsdata.length >= 3 && (
            <p className="mt-3 text-center text-caption text-ink-soft">
              Trusted Circle is full (3 people). Remove someone to add another.
            </p>
          )}
        </section>
      </div>

      {showLoader && (
        <div className="fixed inset-0 flex items-center justify-center bg-ink/30 z-50">
          <Loader />
        </div>
      )}

      {selectedContact && (
        <div className="fixed inset-0 bg-ink/40 flex items-end sm:items-center justify-center p-4 z-40">
          <div className="card-surface w-full max-w-lg p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img className="h-14 w-14 rounded-full object-cover" src={selectedContact.photo} alt="" />
                <div>
                  <h3 className="text-heading">{selectedContact.name}</h3>
                  <p className="mono-readout normal-case tracking-normal">{selectedContact.MobileNo}</p>
                  {selectedContact.email && (
                    <p className="text-caption text-ink-soft">{selectedContact.email}</p>
                  )}
                </div>
              </div>
              <button type="button" className="btn-ghost" onClick={() => setSelectedContact(null)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <button
              type="button"
              className="btn-secondary w-full mt-6"
              onClick={() => handleDelete(selectedContact._id)}
            >
              Remove from circle
            </button>
          </div>
        </div>
      )}

      {showAddContact && (
        <div className="fixed inset-0 bg-ink/40 flex items-end sm:items-center justify-center p-4 z-40">
          <div className="card-surface max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading">Add to Trusted Circle</h2>
              <button type="button" className="btn-ghost" onClick={() => setShowAddContact(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(Submit)} className="space-y-4">
              <div>
                <label className="field-label">Profile photo</label>
                <input
                  type="file"
                  accept="image/png, image/jpg, image/jpeg, image/webp"
                  className="field-input"
                  {...register('photo', { required: true })}
                />
              </div>
              <div>
                <label className="field-label">Name</label>
                <input type="text" className="field-input" placeholder="Who should we alert" {...register('name', { required: true })} />
              </div>
              <div>
                <label className="field-label">Mobile number</label>
                <input type="text" className="field-input" placeholder="10 digit mobile number" {...register('MobileNo', { required: true })} />
              </div>
              <div>
                <label className="field-label">Email</label>
                <input type="email" className="field-input" placeholder="name@example.com" {...register('email', { required: true })} />
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <button type="submit" className="btn-primary w-full">Add to Trusted Circle</button>
                <button type="button" onClick={() => setShowAddContact(false)} className="btn-secondary w-full">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default AfterLogin;
