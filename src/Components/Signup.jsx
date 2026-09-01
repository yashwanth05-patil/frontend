import React, { useState, useContext } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useForm } from "react-hook-form";
import axios from "axios";
import { Config } from '../../API/Config';
import { useGoogleLogin } from "@react-oauth/google";
import { AuthContext } from '../Context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../API/CustomApi';

function Signup() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit } = useForm();
    const [errors, setErrors] = useState("");
    const { checkAuth } = useContext(AuthContext);
    const navigate = useNavigate();

    const Submit = async (data) => {
        setErrors("");
        try {
            if (data.password !== password) {
                setErrors("Passwords do not match");
                return;
            }

            if (!data.agreeToTerms) {
                setErrors("Agree to the Terms and Privacy Policy to continue");
                return;
            }

            setIsLoading(true);
            const response = await axios.post(Config.SignUPUrl,
                {
                    username: data.userName,
                    email: data.email,
                    password: data.password
                }
            );

            if (response.data) {
                await checkAuth()
                navigate("/HomePage");
            }
        } catch (error) {
            setErrors(error.response?.data?.message || "Could not create the account. Try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (tokenResponse) => {
        try {
            setIsLoading(true);
            const userInfoResponse = await axios.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                {
                    headers: {
                        Authorization: `Bearer ${tokenResponse.access_token}`
                    }
                }
            );

            const googleUser = userInfoResponse.data;

            const response = await api.post(
                Config.GoogleSignUpUrl,
                {
                    email: googleUser.email,
                    googleId: googleUser.sub,
                    name: googleUser.name,
                    picture: googleUser.picture
                }
            );

            if (response.data) {
                await checkAuth()
                navigate("/HomePage");
            }
        } catch (error) {
            setErrors("Google sign-up did not complete. Try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: (error) => {
            console.error("Google login error:", error);
            setErrors("Google sign-up did not complete. Try again.");
        }
    });

    return (
        <div className="min-h-[calc(100vh-72px)] flex items-center justify-center bg-ink p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <p className="mono-readout mb-3">CREATE ACCOUNT</p>
                    <h1 className="font-display text-display-sm text-mist mb-2">Join your circle</h1>
                    <p className="text-body text-mist-soft">Set up an account so someone can be reached if you need help.</p>
                </div>

                <form onSubmit={handleSubmit(Submit)} className="card-surface p-6 space-y-4">
                    <button
                        type="button"
                        disabled={isLoading}
                        className="btn-secondary w-full"
                        onClick={() => handleGoogleSignup()}
                    >
                        <img src="/google.jfif" alt="" className="w-5 h-5" />
                        {isLoading ? 'Loading…' : 'Continue with Google'}
                    </button>

                    {errors && (
                        <p className="text-caption text-amber text-center">{errors}</p>
                    )}

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate"></div>
                        <span className="flex-shrink mx-4 text-caption text-mist-soft">or</span>
                        <div className="flex-grow border-t border-slate"></div>
                    </div>

                    <div>
                        <label htmlFor="userName" className="field-label">Username</label>
                        <input
                            type="text"
                            id="userName"
                            className="field-input"
                            {...register("userName", {
                                required: "Username is required",
                                maxLength: 20
                            })}
                            placeholder="Choose a username"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="field-label">Email</label>
                        <input
                            type="email"
                            id="email"
                            className="field-input"
                            placeholder="you@example.com"
                            {...register("email", {
                                required: true,
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "invalid email address"
                                }
                            })}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="field-label">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                className="field-input pr-12"
                                placeholder="••••••••"
                                {...register("password", {
                                    required: true,
                                    maxLength: 20
                                })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 min-h-touch min-w-touch text-mist-soft"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="field-label">Confirm password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="field-input pr-12"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 min-h-touch min-w-touch text-mist-soft"
                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                                {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            id="agreeToTerms"
                            className="mt-1 accent-amber"
                            {...register("agreeToTerms", {
                                required: "You must agree to the Terms and Privacy Policy"
                            })}
                        />
                        <label htmlFor="agreeToTerms" className="text-caption text-mist-soft">
                            I agree to the{' '}
                            <a href="/terms" className="text-amber">Terms of Service</a>
                            {' '}and{' '}
                            <a href="/privacy" className="text-amber">Privacy Policy</a>
                        </label>
                    </div>

                    <button type="submit" disabled={isLoading} className="btn-primary w-full">
                        {isLoading ? 'Creating account…' : 'Create account'}
                    </button>

                    <p className="text-center text-caption text-mist-soft">
                        Already have an account?{' '}
                        <Link to="/login" className="text-amber font-medium">
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default Signup;