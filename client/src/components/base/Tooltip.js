import React, { useState, useRef, useEffect, useId } from 'react';

const ARROW_SIZE = 6; // Arrow size in pixels
const ARROW_OFFSET = 8; // How far the arrow is from the edge of the tooltip body

export const Tooltip = ({
  children,
  content,
  position = 'top', // 'top', 'bottom', 'left', 'right'
  delay = 100, // milliseconds
  className = '',
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // For exit animation
  const tooltipId = useId(); // Generate a unique ID for ARIA
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  let timeoutId = useRef(null);

  const showTooltip = () => {
    if (disabled) return;
    if (delay > 0) {
      timeoutId.current = setTimeout(() => {
        setIsVisible(true);
        setIsMounted(true);
      }, delay);
    } else {
      setIsVisible(true);
      setIsMounted(true);
    }
  };

  const hideTooltip = () => {
    if (disabled) return;
    clearTimeout(timeoutId.current);
    setIsMounted(false); // Trigger exit animation
    // Wait for animation to finish before truly unmounting
    // setTimeout(() => setIsVisible(false), 150); // Corresponds to duration-150
  };

  // Handle unmounting after exit animation
  useEffect(() => {
    if (!isMounted && isVisible) {
      const timer = setTimeout(() => setIsVisible(false), 150); // Match transition duration
      return () => clearTimeout(timer);
    }
  }, [isMounted, isVisible]);


  const getPositionClasses = () => {
    let baseClasses = 'absolute z-50';
    let arrowClasses = 'absolute w-0 h-0 border-transparent';
    
    // Default transform origin for scale animation
    let transformOrigin = '';

    // Calculate position based on trigger and tooltip dimensions
    // This is a simplified version. For perfect dynamic positioning,
    // you might need a library like Popper.js or more complex calculations.
    // For now, we rely on Tailwind's positioning relative to the trigger.

    switch (position) {
      case 'top':
        baseClasses += ' bottom-full left-1/2 -translate-x-1/2 mb-2';
        arrowClasses += ` top-full left-1/2 -translate-x-1/2 border-t-[${ARROW_SIZE}px]`;
        transformOrigin = 'origin-bottom';
        break;
      case 'bottom':
        baseClasses += ' top-full left-1/2 -translate-x-1/2 mt-2';
        arrowClasses += ` bottom-full left-1/2 -translate-x-1/2 border-b-[${ARROW_SIZE}px]`;
        transformOrigin = 'origin-top';
        break;
      case 'left':
        baseClasses += ' right-full top-1/2 -translate-y-1/2 mr-2';
        arrowClasses += ` left-full top-1/2 -translate-y-1/2 border-l-[${ARROW_SIZE}px]`;
        transformOrigin = 'origin-right';
        break;
      case 'right':
        baseClasses += ' left-full top-1/2 -translate-y-1/2 ml-2';
        arrowClasses += ` right-full top-1/2 -translate-y-1/2 border-r-[${ARROW_SIZE}px]`;
        transformOrigin = 'origin-left';
        break;
      default: // top
        baseClasses += ' bottom-full left-1/2 -translate-x-1/2 mb-2';
        arrowClasses += ` top-full left-1/2 -translate-x-1/2 border-t-[${ARROW_SIZE}px]`;
        transformOrigin = 'origin-bottom';
    }
    return { baseClasses, arrowClasses, transformOrigin };
  };

  const { baseClasses, arrowClasses, transformOrigin } = getPositionClasses();
  
  const arrowColorClass = () => {
    // Assuming dark tooltip, light arrow
    // Customize if your tooltip background changes
    if (position === 'top') return 'border-t-gray-800 dark:border-t-gray-700';
    if (position === 'bottom') return 'border-b-gray-800 dark:border-b-gray-700';
    if (position === 'left') return 'border-l-gray-800 dark:border-l-gray-700';
    if (position === 'right') return 'border-r-gray-800 dark:border-r-gray-700';
    return 'border-t-gray-800 dark:border-t-gray-700';
  };

  if (!content || React.Children.count(children) === 0) {
    return <>{children}</>; // Return children if no content or no trigger
  }

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex items-center" // Use inline-flex for better alignment of children
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip} // For keyboard accessibility
      onBlur={hideTooltip}  // For keyboard accessibility
      // For elements that are not naturally focusable (like spans),
      // you might need to add tabIndex="0" to the child if it's not interactive.
    >
      {React.cloneElement(React.Children.only(children), {
        'aria-describedby': isVisible && !disabled ? tooltipId : undefined,
      })}
      {isVisible && (
        <div
          id={tooltipId}
          ref={tooltipRef}
          role="tooltip"
          className={`
            ${baseClasses}
            px-3 py-1.5 text-xs font-medium text-white 
            bg-gray-800 rounded-md shadow-lg
            transition-all duration-150 ease-in-out
            dark:bg-gray-700 dark:text-gray-100
            ${transformOrigin}
            ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}
            ${className}
          `}
        >
          {content}
          <div className={`${arrowClasses} ${arrowColorClass()}`} />
        </div>
      )}
    </span>
  );
};
