import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaBell, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes, FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { userAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Notifications = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    if (!user?._id && !user?.id) {
      navigate('/login');
      return;
    }
    fetchNotifications();
  }, [user, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const userId = user?._id || user?.id;
      if (!userId) return;

      const params = {};
      if (filter === 'unread') {
        params.read = 'false';
      } else if (filter === 'read') {
        params.read = 'true';
      }

      const response = await userAPI.getNotifications(userId, params);
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="text-green-500" />;
      case 'warning':
        return <FaExclamationCircle className="text-yellow-500" />;
      case 'error':
        return <FaExclamationCircle className="text-red-500" />;
      default:
        return <FaInfoCircle className="text-blue-500" />;
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const userId = user?._id || user?.id;
      if (!userId) return;

      const response = await userAPI.markNotificationAsRead(userId, { notificationId });
      if (response.data.success) {
        toast.success('Notification marked as read');
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error(error.response?.data?.message || 'Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const userId = user?._id || user?.id;
      if (!userId) return;

      const response = await userAPI.markAllNotificationsAsRead(userId);
      if (response.data.success) {
        toast.success('All notifications marked as read');
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error(error.response?.data?.message || 'Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const userId = user?._id || user?.id;
      if (!userId) return;

      const response = await userAPI.deleteNotification(userId, { notificationId });
      if (response.data.success) {
        toast.success('Notification deleted');
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error(error.response?.data?.message || 'Failed to delete notification');
    }
  };

  // Filter is handled by API, but we can also filter client-side for consistency
  const filteredNotifications = notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
              <FaBell className="text-kayak-blue" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-gray-600">Stay updated with your travel bookings and deals</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn-secondary flex items-center space-x-2"
            >
              <FaCheck />
              <span>Mark All Read</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'read', label: 'Read' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-6 py-3 rounded-lg transition-all duration-300 ${
                filter === f.id
                  ? 'bg-kayak-blue text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-kayak-blue-light'
              }`}
            >
              <span className="font-semibold">{f.label}</span>
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification._id || notification.notificationId || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`card p-6 ${!notification.read ? 'bg-blue-50 border-l-4 border-kayak-blue' : ''}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="mt-1">{getIcon(notification.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-gray-600 mb-2">{notification.message}</p>
                          <p className="text-sm text-gray-500">{formatTime(notification.createdAt)}</p>
                        </div>
                        <div className="flex space-x-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.notificationId || notification._id)}
                              className="p-2 text-gray-600 hover:text-kayak-blue hover:bg-kayak-blue-light rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <FaCheck />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.notificationId || notification._id)}
                            className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-16">
            <FaBell className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">
              {filter === 'all'
                ? "You're all caught up! No notifications at the moment."
                : `No ${filter} notifications found.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

