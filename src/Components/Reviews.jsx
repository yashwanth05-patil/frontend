import React, { useContext, useEffect, useState } from 'react';
import { Search, Plus, Star, X } from 'lucide-react';
import BottomNav from './Home/BottomNav';
import { useForm } from 'react-hook-form';
import api from '../../API/CustomApi';
import { Config } from '../../API/Config';
import { AuthContext } from '../Context/AuthContext';
import Loader from './Home/Loader';

function Reviews() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showAddReview, setShowAddReview] = useState(false);
    const { handleSubmit, register, reset } = useForm();
    const { user } = useContext(AuthContext);
    const [reviews, setReviews] = useState([]);
    const [allReviews, setAllReviews] = useState([]);

    useEffect(() => {
        const fetchReviews = async () => {
            setIsLoading(true)
            try {
                const response = await api.get(Config.GETREVIEWSUrl);
                if (response.data) {
                    const fetchedReviews = response.data.reviews || [];
                    setReviews(fetchedReviews);
                    setAllReviews(fetchedReviews);
                }
            } catch (error) {
                console.error('An error occurred while fetching reviews:', error);
            } finally {
                setIsLoading(false)
            }
        };
        fetchReviews();
    }, []);

    const handleSubmitReview = async (data) => {
        setIsLoading(true);
        try {
            const response = await api.post(Config.ADDREVIEWUrl, {
                location: data.location,
                title: data.title,
                review: data.review,
                userId: user._id,
            });
            if (response.status === 201) {
                const { review: newReview } = response.data;
                setReviews((prev) => [newReview, ...prev]);
                setAllReviews((prev) => [newReview, ...prev]);
                setShowAddReview(false);
                reset();
            }
        } catch (error) {
            console.error('Error submitting review:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (!searchQuery.trim()) {
                setReviews(allReviews);
            } else {
                const filteredReviews = allReviews.filter((review) =>
                    review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    review.review.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    review.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    review.user?.username.toLowerCase().includes(searchQuery.toLowerCase())
                );
                setReviews(filteredReviews);
            }
        } catch (error) {
            console.error('An error occurred during search:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-shell">
            <div className="max-w-3xl mx-auto space-y-6 pt-2">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="mono-readout mb-1">FIELD NOTES</p>
                        <h1 className="text-heading text-mist">
                            Hello, {user?.username}
                        </h1>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowAddReview(true)}
                        className="btn-primary"
                    >
                        <Plus className="h-5 w-5" />
                        <span className="hidden sm:inline">Add note</span>
                    </button>
                </div>

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-soft" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="field-input pl-10"
                            placeholder="Search places, notes, people"
                        />
                    </div>
                    <button type="submit" className="btn-secondary sm:min-w-[7rem]">
                        Search
                    </button>
                </form>

                {isLoading && (
                    <div className="fixed inset-0 flex items-center justify-center bg-ink/60 z-50">
                        <Loader />
                    </div>
                )}

                <div className="space-y-4">
                    {reviews.length > 0 ? (
                        reviews.map((review) => (
                            <article key={review._id} className="card-surface p-5">
                                <div className="flex justify-between items-center gap-3 mb-3">
                                    <span className="badge-dusk">{review.location}</span>
                                    <span className="mono-readout normal-case tracking-normal">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-heading text-mist mb-2">{review.title}</h3>
                                <p className="text-body text-mist-soft">{review.review}</p>
                                <p className="mt-4 text-caption text-mist-soft">
                                    By <span className="text-mist">{review.user?.username || 'Anonymous'}</span>
                                </p>
                            </article>
                        ))
                    ) : (
                        <div className="card-surface min-h-[280px] flex flex-col items-center justify-center gap-3 p-8 text-center">
                            <Star className="h-6 w-6 text-amber" />
                            <p className="text-body text-mist-soft">
                                No notes yet — add the first one for a place you know.
                            </p>
                            <button type="button" onClick={() => setShowAddReview(true)} className="btn-secondary">
                                Write a note
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showAddReview && (
                <div className="fixed inset-0 bg-ink/70 flex items-end sm:items-center justify-center p-4 z-50">
                    <div className="card-surface max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-heading text-mist">Add a place note</h2>
                            <button type="button" className="btn-ghost" onClick={() => setShowAddReview(false)} aria-label="Close">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(handleSubmitReview)} className="space-y-4">
                            <input type="text" {...register('location', { required: true })} placeholder="Location" className="field-input" />
                            <input type="text" {...register('title', { required: true })} placeholder="Title" className="field-input" />
                            <textarea {...register('review', { required: true })} rows={4} placeholder="What should someone know about this place?" className="field-input" />
                            <div className="flex flex-col gap-3">
                                <button type="submit" className="btn-primary w-full">Save note</button>
                                <button type="button" onClick={() => setShowAddReview(false)} className="btn-secondary w-full">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}

export default Reviews;
