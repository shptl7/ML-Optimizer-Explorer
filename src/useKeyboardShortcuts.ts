import { useEffect, useCallback } from 'react';

interface ShortcutHandlers {
  onPlayPause: () => void;
  onReset: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onView3D: () => void;
  onViewContour: () => void;
  onViewSplit: () => void;
  onToggleGradients: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled: boolean = true) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if user is typing in an input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }

    switch (e.key.toLowerCase()) {
      case ' ': // Space - play/pause
        e.preventDefault();
        handlers.onPlayPause();
        break;
      case 'r': // R - reset
        handlers.onReset();
        break;
      case 'arrowright': // Right arrow - step forward
        e.preventDefault();
        handlers.onStepForward();
        break;
      case 'arrowleft': // Left arrow - step backward
        e.preventDefault();
        handlers.onStepBackward();
        break;
      case '1': // 1 - 3D view
        handlers.onView3D();
        break;
      case '2': // 2 - Contour view
        handlers.onViewContour();
        break;
      case '3': // 3 - Split view
        handlers.onViewSplit();
        break;
      case 'g': // G - toggle gradients
        handlers.onToggleGradients();
        break;
    }
  }, [handlers]);

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}
