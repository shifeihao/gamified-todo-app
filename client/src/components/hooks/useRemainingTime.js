import { useState, useEffect } from "react";

/**
 * Custom hook to calculate and format remaining time until a due date.
 * Updates every minute and handles expiration.
 * 
 * @param {boolean} isActive - Whether to actively calculate time (e.g., for equipped tasks)
 * @param {string} dueDate - ISO date string for the due date
 * @returns {string} Formatted remaining time string
 */
export function useRemainingTime(isActive, dueDate) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!isActive || !dueDate) return; // nothing to track

    const formatRemainingTime = () => {
      const diff = new Date(dueDate).getTime() - Date.now();
      if (diff <= 0) {
        return "Expired";
      }
      
      // Calculate days, hours, minutes with defined constants for readability
      const DAY_MS = 86_400_000;  // 24 * 60 * 60 * 1000
      const HOUR_MS = 3_600_000;  // 60 * 60 * 1000
      const MINUTE_MS = 60_000;   // 60 * 1000
      
      const days = Math.floor(diff / DAY_MS);
      const hours = Math.floor((diff % DAY_MS) / HOUR_MS);
      const minutes = Math.floor((diff % HOUR_MS) / MINUTE_MS);
      
      return `${days}d ${hours}h ${minutes}m`;
    };

    // Initial calculation
    setTimeLeft(formatRemainingTime());
    
    // Update every minute
    const timer = setInterval(() => {
      setTimeLeft(formatRemainingTime());
    }, 60_000);
    
    // Clean up timer on unmount or dependencies change
    return () => clearInterval(timer);
  }, [isActive, dueDate]);

  return timeLeft;
}
