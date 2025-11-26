import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from '../components/Toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', options = {}) => {
    const id = toastId++;
    const toast = {
      id,
      message,
      type,
      title: options.title,
      duration: options.duration || 3000,
      autoClose: options.autoClose !== false,
    };

    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message, options) => {
    return showToast(message, 'success', options);
  }, [showToast]);

  const error = useCallback((message, options) => {
    return showToast(message, 'error', options);
  }, [showToast]);

  const warning = useCallback((message, options) => {
    return showToast(message, 'warning', options);
  }, [showToast]);

  const info = useCallback((message, options) => {
    return showToast(message, 'info', options);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ success, error, warning, info, showToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

