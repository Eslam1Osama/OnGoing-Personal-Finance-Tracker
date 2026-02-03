'use client';

import React, { useEffect, useCallback, useRef, useState } from 'react';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * FormModal - A premium modal component for forms
 * 
 * Features:
 * - Modern glass-morphism design with gradients
 * - Smooth entrance/exit animations
 * - Accessible with ARIA attributes and keyboard navigation
 * - Click-outside-to-close and ESC key support
 * - Responsive with configurable max-width
 * - Beautiful backdrop blur effect
 * - Proper focus management (no stuck button highlights)
 * - Mobile-optimized scrolling behavior
 */
export default function FormModal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxWidth = 'lg',
}: FormModalProps) {
  // Ref to the modal container for focus trapping
  const modalRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  /**
   * Clear all focus to prevent stuck highlight states
   * Focuses body element to ensure no interactive element retains focus
   */
  const clearAllFocus = useCallback(() => {
    // First blur current active element
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // Then explicitly focus body to prevent browser's focus restoration
    document.body.focus();
    // Double-ensure by blurring again after a microtask
    Promise.resolve().then(() => {
      if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
    });
  }, []);

  /**
   * Enhanced close handler that properly manages focus
   * Clears all focus to prevent "stuck" highlight states on trigger buttons
   */
  const handleClose = useCallback(() => {
    clearAllFocus();
    onClose();
  }, [onClose, clearAllFocus]);

  // Handle ESC key press to close modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    },
    [handleClose]
  );

  // Handle click outside modal
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  // Handle close button click
  const handleCloseButtonClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleClose();
    },
    [handleClose]
  );

  // Focus management and animation when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Start animation
      setIsAnimating(true);
      
      // Immediately blur the trigger button when modal opens
      clearAllFocus();
      
      // Add keyboard listener
      document.addEventListener('keydown', handleKeyDown);
      
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // Focus the modal container for accessibility after animation starts
      const focusTimer = setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);

      return () => {
        clearTimeout(focusTimer);
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
        // Final focus clear when unmounting
        clearAllFocus();
        setIsAnimating(false);
      };
    }
  }, [isOpen, handleKeyDown, clearAllFocus]);

  if (!isOpen) return null;

  // Max width classes mapping
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-modal-title"
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      
      {/* Modal Container */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative w-full h-full sm:h-auto ${maxWidthClasses[maxWidth]} bg-gradient-to-br from-white via-white to-gray-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 sm:rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] border-0 sm:border border-gray-200/80 dark:border-gray-700/80 max-h-full sm:max-h-[90vh] flex flex-col outline-none transform transition-all duration-300 ${
          isAnimating ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative gradient line at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 sm:rounded-t-2xl" />
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700/80 flex-shrink-0 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/50 dark:to-transparent">
          <div className="flex items-center gap-3 sm:gap-4">
            {icon && (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                {icon}
              </div>
            )}
            <div>
              <h2
                id="form-modal-title"
                className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white"
              >
                {title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 hidden xs:block">
                Fill in the details below
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseButtonClick}
            className="p-2 sm:p-2.5 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 shadow-sm"
            aria-label="Close form"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {children}
        </div>
      </div>
    </div>
  );
}
