import React from "react";
import PropTypes from "prop-types";

/**
 * Reusable task status badge component
 * Display badges in different colors according to task status
 */
export const StatusBadge = ({ status, className = "" }) => {
  const getStatusStyles = () => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusStyles()} ${className}`}>
      {status}
    </div>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  className: PropTypes.string
};
