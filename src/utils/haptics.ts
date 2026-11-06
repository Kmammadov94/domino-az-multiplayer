/**
 * Haptic Vibration Feedback for Mobile Devices
 * Provides subtle tactile feedback on domino placement, scoring, and match events.
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success') => {
  if (typeof window === 'undefined' || !navigator || !('vibrate' in navigator)) return;
  try {
    switch (type) {
      case 'light':
        navigator.vibrate(12);
        break;
      case 'medium':
        navigator.vibrate([20, 30, 20]);
        break;
      case 'heavy':
        navigator.vibrate([35, 50, 35]);
        break;
      case 'success':
        navigator.vibrate([30, 40, 30, 40, 70]);
        break;
    }
  } catch {
    // Gracefully handle browsers blocking vibration
  }
};
