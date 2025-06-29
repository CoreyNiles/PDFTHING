import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, AlertCircle } from 'lucide-react';
import { PrivacyManager } from '../utils/privacyManager';

const PrivacyIndicator: React.FC = () => {
  const [privacyStatus, setPrivacyStatus] = useState(PrivacyManager.getPrivacyStatus());
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrivacyStatus(PrivacyManager.getPrivacyStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const isClean = privacyStatus.isClean;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg transition-all duration-200 ${
            isClean
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-yellow-600 hover:bg-yellow-700 text-white'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span className="text-sm font-medium">
            {isClean ? 'Privacy Protected' : 'Processing Files'}
          </span>
          {isClean ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full right-0 mb-2 w-80 bg-blueprint-800 border border-blueprint-700 rounded-lg shadow-xl p-4"
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-accent-cyan" />
                  <h3 className="font-semibold text-blueprint-100">Privacy Status</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blueprint-300">Files in Memory:</span>
                    <span className={`font-medium ${privacyStatus.activeFiles === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {privacyStatus.activeFiles}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-blueprint-300">Blob URLs:</span>
                    <span className={`font-medium ${privacyStatus.activeBlobUrls === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {privacyStatus.activeBlobUrls}
                    </span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-blueprint-700">
                  <p className="text-xs text-blueprint-400 leading-relaxed">
                    {isClean ? (
                      <>
                        <Check className="inline h-3 w-3 mr-1 text-green-400" />
                        All files cleared from memory. Your privacy is protected.
                      </>
                    ) : (
                      <>
                        <AlertCircle className="inline h-3 w-3 mr-1 text-yellow-400" />
                        Files are being processed locally. They will be automatically deleted after download.
                      </>
                    )}
                  </p>
                </div>
                
                {!isClean && (
                  <button
                    onClick={() => {
                      PrivacyManager.clearAllData();
                      setShowDetails(false);
                    }}
                    className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
                  >
                    Clear All Data Now
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PrivacyIndicator;