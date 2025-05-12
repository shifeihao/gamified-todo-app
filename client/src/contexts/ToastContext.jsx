import React, { createContext, useContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const showSuccess = (message) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
    });
  };

  const showError = (message) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md flex items-center bg-red-500 text-white px-4 py-3 rounded-md shadow-lg`}
        >
          <X className="mr-2 h-5 w-5" />
          <span>{message}</span>
        </div>
      ),
      {
        duration: 4000,
        position: 'top-center',
      }
    );
  };

  const showInfo = (message) => {
    toast(message, {
      duration: 3000,
      position: 'top-right',
      icon: '📢',
    });
  };

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 