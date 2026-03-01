import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaStar, FaCar, FaThumbsUp } from 'react-icons/fa';
import axios from 'axios';
import ReviewModal from './ReviewModal';
import { useSelector } from 'react-redux';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const StarDisplay = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <FaStar key={s} size={13} className={s <= rating ? 'text-yellow-400' : 'text-gray-200'} />
    ))}
  </div>
);

/**
 * CarReviewsModal — lists customer reviews for a rental car with aggregate stats.
 */
const CarReviewsModal = ({ isOpen, onClose, car }) => {
  const { user } = useSelector((state) => state.auth);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);

  const carId = car?._id || car?.carId;
  const carName = car ? `${car.year || ''} ${car.company} ${car.model}`.trim() : '';

  const fetchReviews = async () => {
    if (!carId) return;
    setLoading(true);
    try {
      const [revRes, statRes] = await Promise.all([
        axios.get(`${API_BASE}/api/reviews/car/${carId}`),
        axios.get(`${API_BASE}/api/reviews/car/${carId}/stats`),
      ]);
      setReviews(revRes.data?.data || []);
      setStats(statRes.data?.data || null);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchReviews();
  }, [isOpen, carId]);

  const handleHelpful = async (reviewId) => {
    try {
      await axios.post(`${API_BASE}/api/reviews/review/${reviewId}/helpful`);
      fetchReviews();
    } catch {}
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b shrink-0">
                <div className="flex items-center gap-2">
                  <FaCar className="text-blue-600" />
                  <div>
                    <h2 className="font-bold text-gray-800">Customer Reviews</h2>
                    <p className="text-xs text-gray-500">{carName}</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <FaTimes size={20} />
                </button>
              </div>

              {/* Stats bar */}
              {stats && (
                <div className="px-5 py-3 bg-blue-50 border-b shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.average?.toFixed(1)}</p>
                      <StarDisplay rating={Math.round(stats.average)} />
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-4 text-gray-500">{star}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-yellow-400 h-1.5 rounded-full"
                              style={{
                                width: stats.total
                                  ? `${((stats.distribution?.[star] || 0) / stats.total) * 100}%`
                                  : '0%',
                              }}
                            />
                          </div>
                          <span className="w-5 text-gray-400">{stats.distribution?.[star] || 0}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-center text-xs text-gray-500">
                      <p className="font-semibold text-gray-700">{stats.total}</p>
                      <p>reviews</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {loading && <p className="text-center text-gray-400 py-8">Loading reviews…</p>}
                {!loading && reviews.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No reviews yet. Be the first!</p>
                )}
                {reviews.map((r) => (
                  <div key={r._id} className="border rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{r.user_name}</p>
                        <StarDisplay rating={r.rating} />
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{r.review_text}</p>
                    <button
                      onClick={() => handleHelpful(r._id)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 mt-2"
                    >
                      <FaThumbsUp size={11} /> Helpful ({r.helpful_count || 0})
                    </button>
                  </div>
                ))}
              </div>

              {user && (
                <div className="p-4 border-t shrink-0">
                  <button
                    onClick={() => setWriteOpen(true)}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Write a Review
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ReviewModal
        isOpen={writeOpen}
        onClose={() => setWriteOpen(false)}
        entityType="car"
        entityId={carId}
        entityName={carName}
        onSubmitted={fetchReviews}
      />
    </>
  );
};

export default CarReviewsModal;
