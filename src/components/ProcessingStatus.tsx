import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ProcessingStatusProps {
  message: string;
  subMessage?: string;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ message, subMessage }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="bg-blueprint-800 rounded-2xl p-12 border border-blueprint-700 max-w-md mx-auto">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="inline-flex p-4 bg-accent-cyan/10 rounded-2xl mb-6"
        >
          <Loader2 className="h-12 w-12 text-accent-cyan" strokeWidth={1} />
        </motion.div>
        
        <h3 className="text-xl font-semibold text-blueprint-100 mb-2">{message}</h3>
        {subMessage && (
          <p className="text-blueprint-400">{subMessage}</p>
        )}
        
        <div className="mt-6">
          <div className="w-full bg-blueprint-700 rounded-full h-2">
            <motion.div
              className="bg-accent-cyan h-2 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProcessingStatus;