import React, { useState, useEffect } from 'react';

const MAX_WIDTH_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

/**
 * Common modal: bottom-to-top slide on mobile, centered on desktop.
 * - Mobile: full width, rounded top corners, slides up from bottom.
 * - Desktop (sm+): centered, rounded, scale-in.
 */
const BaseModal = ({
  isOpen = true,
  onClose,
  children,
  slideFromBottom = true,
  maxWidth = 'lg',
  panelClassName = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
      return () => cancelAnimationFrame(t);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevScrollY = window.scrollY;
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${prevScrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      window.scrollTo(0, prevScrollY);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClass = typeof maxWidth === 'string' ? MAX_WIDTH_MAP[maxWidth] || MAX_WIDTH_MAP.lg : '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        className={`absolute inset-0 bg-black/80 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      <div
        className={`
          relative w-full ${maxWidthClass} max-h-[92vh] sm:max-h-[90vh]
          bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl
          flex flex-col overflow-hidden
          transition-all duration-300 ease-out
          ${slideFromBottom
            ? isVisible
              ? 'translate-y-0'
              : 'translate-y-full sm:translate-y-0 sm:scale-95 sm:opacity-0'
            : isVisible
              ? 'translate-y-0 scale-100 opacity-100'
              : 'scale-95 opacity-0'
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${panelClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default BaseModal;
