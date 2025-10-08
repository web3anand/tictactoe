// Suppress Coinbase analytics errors that are blocked by ad blockers
// These errors don't affect functionality but can be noisy in development

if (typeof window !== 'undefined') {
  // Suppress console errors for blocked Coinbase analytics
  const originalError = console.error;
  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    
    // Filter out Coinbase analytics errors
    if (
      message.includes('cca-lite.coinbase.com') ||
      message.includes('Analytics SDK') ||
      message.includes('ERR_BLOCKED_BY_CLIENT') ||
      message.includes('Failed to fetch') && message.includes('injected.js')
    ) {
      return; // Suppress these specific errors
    }
    
    // Log other errors normally
    originalError.apply(console, args);
  };

  // Suppress unhandled promise rejections for analytics
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.toString() || '';
    
    if (
      reason.includes('cca-lite.coinbase.com') ||
      reason.includes('Analytics SDK') ||
      reason.includes('ERR_BLOCKED_BY_CLIENT')
    ) {
      event.preventDefault(); // Suppress these specific rejections
    }
  });
}