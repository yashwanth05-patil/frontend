import React, { useContext, useEffect, useState } from 'react';
import SOSButton from '../SOSButton';
import { Plus, X, CircleX, Mic, MicOff, Video, StopCircle } from 'lucide-react';
import BottomNav from './BottomNav';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../../Context/AuthContext';
import api from '../../../API/CustomApi';
import { Config } from '../../../API/Config';
import Loader from './Loader';
import { toast } from "react-toastify"
import { useSOSRecorder } from './useSOSRecorder';
import { useVoiceActivation } from './useVoiceActivation';

function AfterLogin() {
  const [showAddContact, setShowAddContact] = useState(false);
  const { handleSubmit, register } = useForm();
  const { user, setUser } = useContext(AuthContext);
  const [contactsdata, setContactsdata] = useState([]);
  const [showLoader, setShowLoader] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const { status: recordingStatus, startRecording, stopRecording, maxDurationMs } = useSOSRecorder();

  const sendEvidenceLink = async (evidenceUrl) => {
    if (!evidenceUrl || !contactsdata || contactsdata.length === 0) return;
    try {
      await api.post(Config.SENDEVIDENCEUrl, {
        contacts: contactsdata,
        evidenceUrl,
        senderName: user?.username || 'Someone',
      });
      toast.success('📹 Evidence clip sent to your contacts!');
    } catch (error) {
      console.error('Error sending evidence link:', error);
      toast.error('Alert sent, but evidence link failed to email');
    }
  };

  const {
    isSupported: voiceSupported,
    isListening: voiceListening,
    micError: voiceError,
    startListening: startVoiceActivation,
    stopListening: stopVoiceActivation,
  } = useVoiceActivation(() => {
    toast.info('🎙️ Wake phrase detected — triggering SOS');
    handleSOS();
  });

  useEffect(() => {
    setContactsdata(Array.isArray(user?.contacts) ? user.contacts : []);
  }, [user]);

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
        toast.success('Contact added successfully!');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add contact');
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
        toast.success('Contact deleted!');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
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
    setShowLoader(true);
    setLocationError(null);

    try {
      if (!contactsdata || contactsdata.length === 0) {
        throw new Error('No emergency contacts available');
      }

      const location = await getLocation();

      const response = await api.post(Config.EMERGENCYUrl, {
        contacts: contactsdata,
        contactNumbers: contactsdata.map((c) => c.MobileNo),
        senderName: user?.username || "Someone",
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      });

      toast.success('🚨 Emergency alerts sent to all contacts!');

      // Location alert is already out. Now start recording audio/video
      // evidence in the background - this does not block or delay the
      // alert above, since speed on the initial alert matters most.
      toast.info('🔴 Recording evidence clip in the background…');
      startRecording(user?._id).then((evidenceUrl) => {
        if (evidenceUrl) {
          sendEvidenceLink(evidenceUrl);
        } else {
          toast.warn('Could not record evidence (camera/mic unavailable)');
        }
      });
    } catch (error) {
      console.error('SOS Error:', error);
      setLocationError(error.message);
      toast.error('Emergency alert failed: ' + error.message);
    } finally {
      setShowLoader(false);
    }
  };

  return (
    <div className="w-full p-2 bg-slate-50">
      {locationError && (
        <div className="p-2 mb-2 bg-red-100 text-red-800 text-center">
          {locationError}
        </div>
      )}

      <div className="w-full flex items-center justify-center gap-3 pt-3">
        <button
          onClick={voiceListening ? stopVoiceActivation : startVoiceActivation}
          disabled={!voiceSupported}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors
            ${voiceListening ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-700 border-gray-300'}
            ${!voiceSupported ? 'opacity-40 cursor-not-allowed' : 'hover:border-red-400'}`}
          title={voiceSupported ? 'Toggle hands-free voice activation' : 'Not supported in this browser'}
        >
          {voiceListening ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
          {voiceListening ? 'Listening for "help me"…' : 'Voice Activation'}
        </button>
      </div>
      {!voiceSupported && (
        <p className="text-center text-xs text-gray-400 mt-1">
          Voice activation needs Chrome/Edge on Android or desktop — not supported in this browser.
        </p>
      )}
      {voiceError && (
        <p className="text-center text-xs text-red-500 mt-1">{voiceError}</p>
      )}

      <div className="w-full h-[40vh] p-2 flex items-center justify-center" onClick={handleSOS}>
        <SOSButton />
      </div>

      {recordingStatus === 'recording' && (
        <div className="w-full flex flex-col items-center gap-2 -mt-4 mb-4">
          <div className="flex items-center gap-2 text-red-600 text-sm font-semibold">
            <Video className="w-4 h-4 animate-pulse" />
            Recording evidence (auto-stops in {Math.round(maxDurationMs / 1000)}s)…
          </div>
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
          >
            <StopCircle className="w-4 h-4" />
            Stop &amp; send now
          </button>
        </div>
      )}
      {recordingStatus === 'uploading' && (
        <p className="text-center text-sm text-gray-500 -mt-4 mb-4">Uploading evidence clip…</p>
      )}

      <div className="w-full p-4">
        <h1 className="text-gray-900 text-xl font-bold md:text-2xl">Emergency Contacts</h1>
        <div className="w-full flex flex-col gap-3 mt-4 md:flex-row md:flex-wrap md:justify-center md:items-center">
          {contactsdata.length > 0 ? (
            contactsdata.map((contact, index) => (
              <div
                key={index}
                className="w-full p-4 rounded-lg bg-white shadow-sm hover:shadow-md border flex items-center gap-4 md:w-[30%] justify-between"
              >
                <img
                  className="w-16 h-16 rounded-full object-cover"
                  src={contact.photo}
                  alt="Contact"
                />
                <div>
                  <h2 className="text-gray-700 font-bold">{contact.name}</h2>
                  <h3 className="text-gray-500">{contact.MobileNo}</h3>
                  {contact.email && (
                    <h3 className="text-gray-400 text-sm">{contact.email}</h3>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(contact._id)}
                  className="w-10 h-10 rounded-lg border-none hover:text-red-400"
                >
                  <CircleX className="h-6 w-6" />
                </button>
              </div>
            ))
          ) : (
            <h1 className="text-gray-700 font-bold">No Contacts Found</h1>
          )}
        </div>
      </div>

      <div className="w-full p-4 flex items-center justify-center flex-col">
        <button
          className="text-red-400 font-bold flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg border hover:border-red-300"
          onClick={() => setShowAddContact(true)}
          disabled={contactsdata.length >= 3}
        >
          <Plus className="w-5 h-5" />
          Add New Contact
        </button>
        {contactsdata.length >= 3 && (
          <span className="text-red-700 text-center">
            You Can Add Maximum 3 Contacts
          </span>
        )}
      </div>

      {showLoader && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <Loader />
        </div>
      )}

      {showAddContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Add New Contact</h2>
                <button
                  onClick={() => setShowAddContact(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(Submit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Profile Photo</label>
                  <input
                    type="file"
                    accept="image/png, image/jpg, image/jpeg, image/webp"
                    className="block w-full px-3 py-2 border rounded-lg"
                    {...register('photo', { required: true })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Name</label>
                  <input
                    type="text"
                    className="block w-full px-3 py-2 border rounded-lg"
                    placeholder="Contact name"
                    {...register('name', { required: true })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Contact Number</label>
                  <input
                    type="text"
                    className="block w-full px-3 py-2 border rounded-lg"
                    placeholder="10 digit mobile number"
                    {...register('MobileNo', { required: true })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Email Address</label>
                  <input
                    type="email"
                    className="block w-full px-3 py-2 border rounded-lg"
                    placeholder="emergency@example.com"
                    {...register('email', { required: true })}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddContact(false)}
                    className="px-4 py-2 text-sm border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default AfterLogin;
