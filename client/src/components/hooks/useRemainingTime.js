import { useState, useEffect } from "react";

/**
 * Custom hook to calculate and format remaining time until a due date.
 * The update frequency matches the display precision:
 * - When showing seconds: updates every second
 * - When showing minutes or higher: updates every minute
 * 
 * @param {boolean} isActive - Whether to actively calculate time (e.g., for equipped tasks or short tasks)
 * @param {string} dueDate - ISO date string for the due date
 * @returns {string} Formatted remaining time string
 */
export function useRemainingTime(isActive, dueDate) {
  const [timeLeft, setTimeLeft] = useState("");
  const [updateInterval, setUpdateInterval] = useState(60000); // Default to minute updates

  useEffect(() => {
    if (!isActive || !dueDate) return; // nothing to track
    
    const formatRemainingTime = () => {
      const diff = new Date(dueDate).getTime() - Date.now();
      if (diff <= 0) {
        return "Expired";
      }
      
      // Calculate days, hours, minutes, seconds with defined constants for readability
      const DAY_MS = 86_400_000;  // 24 * 60 * 60 * 1000
      const HOUR_MS = 3_600_000;  // 60 * 60 * 1000
      const MINUTE_MS = 60_000;   // 60 * 1000
      
      const days = Math.floor(diff / DAY_MS);
      const hours = Math.floor((diff % DAY_MS) / HOUR_MS);
      const minutes = Math.floor((diff % HOUR_MS) / MINUTE_MS);
      
      // Determine when to show seconds based on time remaining
      // Show seconds when less than 1 hour remains
      const shouldShowSeconds = hours === 0 && days === 0;
      
      // Adjust update interval based on remaining time
      let newInterval;
      if (days > 0) {
        // Update every hour when more than a day remains
        newInterval = 3600000; // 1 hour
      } else if (hours > 2) {
        // Update every 30 minutes when more than 2 hours remain
        newInterval = 1800000; // 30 minutes
      } else if (hours > 0 || minutes > 10) {
        // Update every minute when more than 10 minutes remain
        newInterval = 60000; // 1 minute
      } else {
        // Update every second when less than 10 minutes remain
        newInterval = 1000; // 1 second
      }
      
      // Update the interval if needed
      if (newInterval !== updateInterval) {
        setUpdateInterval(newInterval);
      }
      
      // Format based on remaining time - only show seconds when necessary
      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        if (shouldShowSeconds) {
          const seconds = Math.floor((diff % MINUTE_MS) / 1000);
          return `${minutes}m ${seconds}s`;
        }
        return `${minutes}m`;
      } else {
        const seconds = Math.floor(diff / 1000);
        return `${seconds}s`;
      }
    };

    // Initial calculation
    const formattedTime = formatRemainingTime();
    setTimeLeft(formattedTime);
    
    // Update on interval
    const timer = setInterval(() => {
      const formattedTime = formatRemainingTime();
      setTimeLeft(formattedTime);
    }, updateInterval);
    
    // Clean up timer on unmount or dependencies change
    return () => clearInterval(timer);
  }, [isActive, dueDate, updateInterval]);

  return timeLeft;
}
