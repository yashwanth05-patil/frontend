import { Camera, LogOut, Settings, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import BottomNav from './Home/BottomNav'
import { useContext, useState } from 'react'
import { AuthContext } from '../Context/AuthContext'
import ReviewCard from './ReviewCard'
import api from '../../API/CustomApi'
import { Config } from '../../API/Config'

const ProfileSection = ({ title, children }) => (
  <div className="card-surface overflow-hidden">
    <h2 className="text-heading text-ink p-4 border-b border-slate-line">{title}</h2>
    {children}
  </div>
)

function Profile() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useContext(AuthContext);
  const [isUploading, setIsUploading] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const { register, handleSubmit, reset, watch } = useForm();

  const photoFile = watch('photo');

  const handleLogout = async () => {
    await logout();
    navigate("/login")
  }

  const handleSettings = () => {
    navigate("/settings")
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Choose an image file');
      reset({ photo: null });
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('File size should be less than 5MB');
      reset({ photo: null });
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
  }

  const onSubmit = async (data) => {
    if (!data.photo?.[0]) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('userId', user._id);
      formData.append('photo', data.photo[0]);

      const response = await api.post(Config.ADDPROFILEPHOTO, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        setUser((prevUser) => ({
          ...prevUser,
          profilePhoto: response.data.updatedUser.profilePhoto
        }))
      }
    } catch (error) {
      console.error("Failed to upload the file", error);
    } finally {
      setIsUploading(false);
      setShowPhotoModal(false);
    }
  };

  const handleCloseModal = () => {
    setShowPhotoModal(false);
    setPreviewUrl(null);
    reset();
  }

  const reviews = user?.reviews || [];

  return (
    <div className="page-shell">
      <div className="max-w-2xl mx-auto space-y-6 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="mono-readout mb-1">PROFILE</p>
            <h1 className="text-heading">Your instrument</h1>
          </div>
          <button type="button" className="btn-ghost" onClick={handleSettings} aria-label="Settings">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="card-surface p-4 flex items-center gap-4">
          <div className="relative">
            <img
              src={user?.profilePhoto ? user.profilePhoto : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvFbJHIvlkPWSvsJ1rWRbr64ZPiCCdb1SCLg&s"}
              alt=""
              className="w-20 h-20 rounded-full object-cover border border-slate-line"
            />
            <button
              type="button"
              className="absolute bottom-0 right-0 bg-dusk p-1.5 rounded-full text-paper-raised min-h-[32px] min-w-[32px]"
              onClick={() => setShowPhotoModal(true)}
              aria-label="Update photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-heading truncate">{user?.username}</h2>
            <p className="text-caption text-ink-soft truncate">{user?.email}</p>
          </div>
        </div>

        <ProfileSection title="Recent notes">
          {reviews.length > 0 ? reviews.map((review, index) => (
            <ReviewCard key={index} {...review} username={user.username} />
          )) : (
            <p className="p-4 text-body text-ink-soft">No notes yet — they will appear here after you add one.</p>
          )}
        </ProfileSection>

        <button type="button" className="btn-secondary w-full" onClick={handleLogout}>
          <LogOut className="w-5 h-5" />
          Log out
        </button>
      </div>

      {showPhotoModal && (
        <div className="fixed inset-0 bg-ink/40 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="card-surface max-w-lg w-full p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-heading">Update photo</h2>
                <button type="button" onClick={handleCloseModal} className="btn-ghost" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {previewUrl ? (
                  <div className="relative w-32 h-32 mx-auto">
                    <img src={previewUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        reset({ photo: null });
                        setPreviewUrl(null);
                      }}
                      className="absolute top-0 right-0 bg-dusk rounded-full p-1 text-paper-raised"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => document.getElementById('photo-upload').click()}
                    className="w-32 h-32 mx-auto border border-dashed border-dusk rounded-full flex items-center justify-center text-dusk"
                  >
                    <Camera className="w-8 h-8" />
                  </button>
                )}

                <input
                  id="photo-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  {...register('photo', {
                    onChange: handleFileChange
                  })}
                />
                <p className="text-caption text-ink-soft text-center">
                  Tap to {previewUrl ? 'change' : 'upload'} a photo
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={!photoFile?.[0] || isUploading}
                  className="btn-primary w-full"
                >
                  {isUploading ? 'Uploading…' : 'Save photo'}
                </button>
                <button type="button" onClick={handleCloseModal} className="btn-secondary w-full">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

export default Profile
