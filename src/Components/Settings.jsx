import React, { useContext, useState } from 'react';
import { ChevronLeft, User, Mail, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../API/CustomApi';
import { Config } from '../../API/Config';
import { AuthContext } from '../Context/AuthContext';

function Settings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { user } = useContext(AuthContext)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      username: '',
      email: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (data.username) {
        const response = await api.post(Config.UPDATEUSERNAME, {
          userId: user._id,
          username: data.username,
        });

        if (response.data.success) {
          setSuccessMessage('Username updated');
          reset({ username: '' });
        }
      }

      if (data.email) {
        const response = await api.post(Config.UPDATEEMAIL, {
          userId: user._id,
          email: data.email,
          isGoogleUser: user.isGoogleUser,
        });

        if (response.data.success) {
          setSuccessMessage('Email updated');
          reset({ email: '' });
        }
      }

      if (data.currentPassword && data.newPassword) {
        if (data.newPassword !== data.confirmPassword) {
          setError('New passwords do not match');
          setLoading(false);
          return;
        }

        const response = await api.post(Config.UPDATEPASSWORD, {
          userId: user._id,
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          isGoogleUser: user.isGoogleUser,
        });

        if (response.data.success) {
          setSuccessMessage('Password updated');
          reset({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save these changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/profile" className="btn-ghost" aria-label="Back to profile">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <p className="mono-readout">ACCOUNT</p>
            <h1 className="text-heading">Settings</h1>
          </div>
        </div>

        {error && (
          <div className="bg-amber-soft text-amber px-4 py-3 rounded-card mb-4 text-body">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-teal-soft text-teal px-4 py-3 rounded-card mb-4 text-body">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="card-surface p-4">
            <h2 className="text-heading text-mist mb-4">Username</h2>
            <label className="field-label">New username</label>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-mist-soft shrink-0" />
              <input
                type="text"
                {...register('username', {
                  minLength: {
                    value: 3,
                    message: 'Username must be at least 3 characters'
                  }
                })}
                className="field-input"
                placeholder="Enter new username"
              />
            </div>
            {errors.username && (
              <p className="text-amber text-caption mt-2">{errors.username.message}</p>
            )}
          </div>

          <div className="card-surface p-4">
            <h2 className="text-heading text-mist mb-4">Email</h2>
            <label className="field-label">New email</label>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-mist-soft shrink-0" />
              <input
                type="email"
                {...register('email', {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email'
                  }
                })}
                className="field-input"
                placeholder="Enter new email"
              />
            </div>
            {errors.email && (
              <p className="text-amber text-caption mt-2">{errors.email.message}</p>
            )}
          </div>

          <div className="card-surface p-4 space-y-4">
            <h2 className="text-heading text-mist">Password</h2>
            <div>
              <label className="field-label">Current password</label>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-mist-soft shrink-0" />
                <input type="password" {...register('currentPassword')} className="field-input" placeholder="Current password" />
              </div>
            </div>
            <div>
              <label className="field-label">New password</label>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-mist-soft shrink-0" />
                <input
                  type="password"
                  {...register('newPassword', {
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  className="field-input"
                  placeholder="New password"
                />
              </div>
              {errors.newPassword && (
                <p className="text-amber text-caption mt-2">{errors.newPassword.message}</p>
              )}
            </div>
            <div>
              <label className="field-label">Confirm new password</label>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-mist-soft shrink-0" />
                <input type="password" {...register('confirmPassword')} className="field-input" placeholder="Confirm new password" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Settings;
