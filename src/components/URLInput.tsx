import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, ArrowRight, AlertTriangle } from 'lucide-react';

interface URLInputProps {
  onUrlSubmit: (url: string) => void;
  title: string;
  subtitle: string;
}

const URLInput: React.FC<URLInputProps> = ({ onUrlSubmit, title, subtitle }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onUrlSubmit(url);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="border-2 border-dashed border-blueprint-600 rounded-2xl p-8 hover:border-blueprint-500 transition-colors">
        <div className="space-y-6">
          <div className="inline-flex p-6 bg-accent-cyan/10 rounded-2xl">
            <Globe className="h-12 w-12 text-blueprint-400" strokeWidth={1} />
          </div>
          
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-blueprint-100 mb-2">{title}</h3>
            <p className="text-blueprint-400 mb-6">{subtitle}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="mb-4">
              <label className="block text-sm font-medium text-blueprint-200 mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-blueprint-800 border border-blueprint-700 rounded-xl text-blueprint-100 placeholder-blueprint-500 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan"
              />
            </div>
            
            {/* URL Limitations Warning */}
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 mb-4">
              <h4 className="text-yellow-400 font-medium mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Important Note
              </h4>
              <ul className="text-yellow-300 text-sm space-y-1">
                <li>• Some websites may block automated capture for security</li>
                <li>• For best results, use your browser's "Print to PDF" feature</li>
                <li>• Dynamic content may not be captured correctly</li>
              </ul>
            </div>
            
            <button
              type="submit"
              disabled={!url.trim()}
              className={`w-full px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center ${
                url.trim()
                  ? 'bg-accent-cyan text-blueprint-900 hover:bg-accent-cyan/90 hover:scale-105'
                  : 'bg-blueprint-700 text-blueprint-400 cursor-not-allowed'
              }`}
            >
              <span>Convert to PDF</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default URLInput;