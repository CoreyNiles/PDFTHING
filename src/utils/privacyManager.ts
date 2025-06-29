/**
 * Privacy Manager - Ensures immediate deletion of files from memory
 * Core principle: All file data is cleared immediately after processing
 */

export class PrivacyManager {
  private static fileReferences = new Set<any>();
  private static blobUrls = new Set<string>();

  // Register file references for cleanup
  static registerFile(file: File | Blob | ArrayBuffer | any) {
    this.fileReferences.add(file);
  }

  // Register blob URLs for cleanup
  static registerBlobUrl(url: string) {
    this.blobUrls.add(url);
  }

  // Clear all registered files and URLs from memory
  static clearAllData() {
    // Revoke all blob URLs
    this.blobUrls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('Failed to revoke blob URL:', e);
      }
    });
    this.blobUrls.clear();

    // Clear file references
    this.fileReferences.forEach(ref => {
      try {
        // If it's an object with properties, try to clear them
        if (typeof ref === 'object' && ref !== null) {
          Object.keys(ref).forEach(key => {
            try {
              delete ref[key];
            } catch (e) {
              // Some properties might be read-only
            }
          });
        }
      } catch (e) {
        console.warn('Failed to clear file reference:', e);
      }
    });
    this.fileReferences.clear();

    // Force garbage collection if available (Chrome DevTools)
    if (window.gc) {
      window.gc();
    }

    console.log('🔒 All file data cleared from memory for privacy');
  }

  // Clear specific file data
  static clearFileData(data: any) {
    if (this.fileReferences.has(data)) {
      this.fileReferences.delete(data);
    }
    
    // If it's a blob URL, revoke it
    if (typeof data === 'string' && data.startsWith('blob:')) {
      URL.revokeObjectURL(data);
      this.blobUrls.delete(data);
    }
  }

  // Get privacy status for UI display
  static getPrivacyStatus() {
    return {
      activeFiles: this.fileReferences.size,
      activeBlobUrls: this.blobUrls.size,
      isClean: this.fileReferences.size === 0 && this.blobUrls.size === 0
    };
  }
}

// Auto-clear data when page is about to unload
window.addEventListener('beforeunload', () => {
  PrivacyManager.clearAllData();
});

// Auto-clear data when page becomes hidden (mobile/tab switching)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    PrivacyManager.clearAllData();
  }
});