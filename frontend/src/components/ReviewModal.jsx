import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaStar } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * ReviewModal — generic review submission modal for flights, hotels, and cars.
 * Props:
 *   isOpen       {boolean}
 *   onClose      {() => void}
 *   entityType   {'flight' | 'hotel' | 'car'}
 *   entityId     {string}
 *   entityName   {string}
 *   onSubmitted  {() => void}  called after a successful submission
 */
const ReviewModal = ({ isOpen, onClose, entityType, entityId, entityName, onSubmitted }) => {
  const { user } = useSelector((state) => state.auth);
  const toast = useToast();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setRating(0);
    setHovered(0);
    setReviewText('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast?.error('Please select a star rating');
      return;
    }
    if (!reviewText.trim()) {
      toast?.error('Please write a review');
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE}/api/reviews/${entityType}/${entityId}`,
        {
          entity_name: entityName,
          user_id: user?.user_id || user?.id,
          user_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Anonymous',
          rating,
          review_text: reviewText.trim(),
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast?.success('Review submitted successfully!');
      onSubmitted?.();
      handleClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit review';
      toast?.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Write a Review</h2>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">
                  {entityType}: {entityName}
                </p>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Star rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <FaStar
                        size={28}
                        className={
                          star <= (hovered || rating)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm text-gray-600 self-center">
                      {['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'][rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Review text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Review
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                  placeholder={`Share your experience with this ${entityType}…`}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-400 text-right mt-1">
                  {reviewText.length}/1000
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReviewModal;
