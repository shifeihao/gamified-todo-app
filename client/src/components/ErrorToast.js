import React from 'react';
import { X } from 'lucide-react';

const ErrorToast = ({ message }) => {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center bg-red-500 text-white px-4 py-3 rounded-md shadow-lg">
      <X className="mr-2 h-5 w-5" />
      <span>{message}</span>
    </div>
  );
};

export default ErrorToast; 