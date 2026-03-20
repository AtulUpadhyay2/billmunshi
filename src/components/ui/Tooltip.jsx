import React, { useState, useRef, useEffect } from "react";

const Tooltip = ({
  title,
  children,
  className = "btn btn-dark",
  content = "Tooltip",
  theme,
  arrow,
  placement = "top",
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), 300);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const bgClass = theme ? `bg-${theme}-500` : "bg-slate-900 dark:bg-slate-700";

  const arrowClass = theme
    ? `fill-current text-${theme}-500`
    : "fill-slate-900 dark:fill-slate-700";

  const placementStyles = {
    top: {
      bottom: "100%",
      left: "50%",
      transform: "translateX(-50%)",
      marginBottom: "8px",
    },
    bottom: {
      top: "100%",
      left: "50%",
      transform: "translateX(-50%)",
      marginTop: "8px",
    },
    left: {
      right: "100%",
      top: "50%",
      transform: "translateY(-50%)",
      marginRight: "8px",
    },
    right: {
      left: "100%",
      top: "50%",
      transform: "translateY(-50%)",
      marginLeft: "8px",
    },
  };

  const arrowStyles = {
    top: { top: "100%", left: "50%", transform: "translateX(-50%)" },
    bottom: {
      bottom: "100%",
      left: "50%",
      transform: "translateX(-50%) rotate(180deg)",
    },
    left: {
      left: "100%",
      top: "50%",
      transform: "translateY(-50%) rotate(-90deg)",
    },
    right: {
      right: "100%",
      top: "50%",
      transform: "translateY(-50%) rotate(90deg)",
    },
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children || <button className={className}>{title}</button>}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 text-slate-50 dark:text-slate-200 rounded-md px-2 py-1.5 text-sm font-medium shadow-md ${bgClass} pointer-events-none`}
          style={{
            ...(placementStyles[placement] || placementStyles.top),
            maxWidth: "320px",
            width: "max-content",
            whiteSpace: "normal",
            wordWrap: "break-word",
          }}
          {...props}
        >
          {content}
          {!arrow && (
            <svg
              className={`absolute ${arrowClass}`}
              style={arrowStyles[placement] || arrowStyles.top}
              width="11"
              height="5"
              viewBox="0 0 30 10"
              preserveAspectRatio="none"
            >
              <polygon points="0,0 30,0 15,10" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
