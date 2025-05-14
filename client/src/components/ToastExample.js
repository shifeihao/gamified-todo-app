import React from "react";
import { useToast } from "../context/ToastContext";

const ToastExample = () => {
  const { showSuccess, showError, showInfo } = useToast();

  return (
    <div className="flex gap-4 p-4">
      <button
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        onClick={() => showSuccess("operate successfully！")}
      >
          Display success message
      </button>

      <button
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        onClick={() => showError("error occurred！")}
      >
          Display error message
      </button>

      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => showInfo("This is an information prompt！")}
      >
          Display information tips
      </button>
    </div>
  );
};

export default ToastExample;
