import axios from 'axios';
import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Config } from '../../API/Config';
import { useGoogleLogin } from "@react-oauth/google";
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../Context/AuthContext';
import api from '../../API/CustomApi';

function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit } = useForm();
    const [errors, setErrors] = useState("");
    const navigate = useNavigate();
    const { checkAuth } = useContext(AuthContext)

    const Submit = async (data) => {
        setErrors("");
        setIsLoading(true);
        try {
            const response = await api.post(Config.LOGINUrl, {
                email: data.email,
                password: data.password
            });
            if (response) {
                await checkAuth()
                navigate("/HomePage")
            }
        } catch (error) {
            setErrors(error.response?.data?.message || error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (tokenResponse) => {
        try {
            setIsLoading(true);
            setErrors("");

            const userInfoResponse = await axios.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                {
                    headers: {
                        Authorization: `Bearer ${tokenResponse.access_token}`
                    }
                }
            );

            const googleUser = userInfoResponse.data;

            const response = await api.post(Config.GoogleSignUpUrl, {
                email: googleUser.email,
                name: googleUser.name,
                googleId: googleUser.sub,
                picture: googleUser.picture
            });

            if (response.data) {
                await checkAuth()
                navigate("/HomePage")
            }
        } catch (error) {
            setErrors(error.response?.data?.message || "Google sign-in did not complete. Try again.");
            console.error("Google login error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: (error) => {
            console.error("Google login error:", error);
            setErrors("Google sign-in did not complete. Try again.");
        }
    });

    return (
        <div className="min-h-[calc(100vh-72px)] flex items-center justify-center bg-paper p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <p className="mono-readout mb-3">SIGN IN</p>
                    <h1 className="font-display text-display-sm text-ink mb-2">Welcome back</h1>
                    <p className="text-body text-ink-soft">Enter your details to continue watching over your circle.</p>
                </div>

                <form onSubmit={handleSubmit(Submit)} className="card-surface p-6 space-y-5">
                    <button
                        type="button"
                        disabled={isLoading}
                        className="btn-secondary w-full"
                        onClick={() => handleGoogleLogin()}
                    >
                        <img src="/google.jfif" alt="" className="w-5 h-5" />
                        Continue with Google
                    </button>

                    <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-slate-line"></div>
                        <span className="flex-shrink mx-4 text-caption text-ink-soft">or</span>
                        <div className="flex-grow border-t border-slate-line"></div>
                    </div>

                    <div>
                        <label htmlFor="email" className="field-label">Email</label>
                        <input
                            type="email"
                            id="email"
                            {...register("email", {
                                required: true,
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "invalid email address"
                                }
                            })}
                            className="field-input"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="field-label">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                {...register("password", {
                                    required: true,
                                    maxLength: 20
                                })}
                                className="field-input pr-12"
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 min-h-touch min-w-touch text-ink-soft"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                            </button>
                        </div>
                        {errors && (
                            <p className="mt-2 text-caption text-dusk">{typeof errors === 'string' ? errors : ''}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <label className="flex items-center text-caption text-ink-soft">
                            <input type="checkbox" className="mr-2 accent-dusk" />
                            Remember me
                        </label>
                        <a href="/forgot-password" className="text-caption text-dusk">
                            Forgot password
                        </a>
                    </div>

                    <button type="submit" disabled={isLoading} className="btn-primary w-full">
                        {isLoading ? 'Signing in…' : 'Sign in'}
                    </button>

                    <p className="text-center text-caption text-ink-soft">
                        Don&apos;t have an account?{' '}
                        <Link to="/register" className="text-dusk font-medium">
                            Create one
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default Login;
