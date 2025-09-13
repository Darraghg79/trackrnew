// Handles differences between web and native app environments
 
export interface PlatformCapabilities {
  isNative: boolean;
  isWeb: boolean;
  canShare: boolean;
  canEmail: boolean;
  canSaveFiles: boolean;
  canPreviewPDF: boolean;
}

/**
 * Detect current platform and available capabilities
 */
export const getPlatformCapabilities = (): PlatformCapabilities => {
  // Check if running in Capacitor native container
  const isCapacitor = !!(window as any).Capacitor;
  
  // Check if native Web Share API is available (modern browsers)
  const hasWebShare = typeof navigator !== 'undefined' && 'share' in navigator;
  
  // Check if we can use native file system (some browsers support this)
  const hasFileSystem = typeof navigator !== 'undefined' && 'storage' in navigator;
  
  return {
    isNative: isCapacitor,
    isWeb: !isCapacitor,
    canShare: isCapacitor || hasWebShare,
    canEmail: isCapacitor, // Only native apps can send emails with attachments
    canSaveFiles: isCapacitor || hasFileSystem,
    canPreviewPDF: true, // Both web and native can preview, just differently
  };
};

/**
 * Check if we're in development mode
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Generate a unique filename for exports
 */
export const generateFilename = (prefix: string, extension: string): string => {
  const date = new Date();
  const timestamp = date.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}_${timestamp}.${extension}`;
};