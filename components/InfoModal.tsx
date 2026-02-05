'use client';

import React, { useEffect, useCallback, useRef, useState } from 'react';

interface InfoSection {
  heading: string;
  lines: string[];
}

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sections: InfoSection[];
}

/**
 * InfoModal - A premium modal component for displaying information
 * 
 * Features:
 * - Modern glass-morphism design with gradients
 * - Smooth entrance/exit animations
 * - Accessible with ARIA attributes and keyboard navigation
 * - Click-outside-to-close and ESC key support
 * - Proper focus management (no stuck button highlights)
 * - Beautiful backdrop blur effect
 */
export default function InfoModal({ isOpen, onClose, title, sections }: InfoModalProps) {
  // Ref to the modal container for focus management
  const modalRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  /**
   * Blur active element (without stealing focus from text inputs).
   *
   * On mobile browsers, focusing `body` / refocusing containers can close the
   * software keyboard or disrupt user interaction. We keep this conservative.
   */
  const blurActiveNonTextElement = useCallback(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) return;

    const tag = active.tagName;
    const isTextInput =
      tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || active.isContentEditable;

    if (isTextInput) return;
    active.blur();
  }, []);

  /**
   * Enhanced close handler that properly manages focus
   * Clears all focus to prevent "stuck" highlight states on trigger buttons
   */
  const handleClose = useCallback(() => {
    blurActiveNonTextElement();
    onClose();
  }, [onClose, blurActiveNonTextElement]);

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
      blurActiveNonTextElement();
      
      // Add keyboard listener
      document.addEventListener('keydown', handleKeyDown);
      
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // Focus the modal container for accessibility after animation starts
      const focusTimer = setTimeout(() => {
        const modalEl = modalRef.current;
        if (!modalEl) return;

        const active = document.activeElement;
        if (active instanceof HTMLElement && modalEl.contains(active)) return;

        modalEl.focus();
      }, 100);

      return () => {
        clearTimeout(focusTimer);
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
        // Final blur to avoid stuck focus highlights (safe for mobile keyboards)
        blurActiveNonTextElement();
        setIsAnimating(false);
      };
    }
  }, [isOpen, handleKeyDown, blurActiveNonTextElement]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      
      {/* Modal Container */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative w-full h-full sm:h-auto max-w-2xl bg-gradient-to-br from-white via-white to-gray-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 sm:rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] border-0 sm:border border-gray-200/80 dark:border-gray-700/80 max-h-full sm:max-h-[90vh] flex flex-col outline-none transform transition-all duration-300 ${
          isAnimating ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative gradient line at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-primary-600 to-purple-600 sm:rounded-t-2xl" />
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700/80 flex-shrink-0 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/50 dark:to-transparent">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-primary-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 hidden xs:block">
                Learn how to use this feature
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseButtonClick}
            className="p-2 sm:p-2.5 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 shadow-sm"
            aria-label="Close info"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {sections.map((section, idx) => (
            <div key={`${section.heading}-${idx}`} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full" />
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  {section.heading}
                </h4>
              </div>
              <ul className="space-y-2.5 pl-3">
                {section.lines.map((line, lineIdx) => (
                  <li key={`${section.heading}-${lineIdx}`} className="flex gap-3 items-start">
                    <span className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700/80 flex justify-end bg-gradient-to-r from-transparent to-gray-50/50 dark:to-gray-800/50">
          <button
            onClick={handleCloseButtonClick}
            className="px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold shadow-lg shadow-primary-500/30 hover:from-primary-700 hover:to-primary-800 hover:shadow-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            type="button"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
