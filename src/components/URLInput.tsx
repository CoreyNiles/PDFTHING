import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, ArrowRight } from 'lucide-react';

interface URLInputProps {
  onUrlSubmit: (url: string) => void;
  title: string;
  subtitle: string;
}

const URLInput: React.FC<URLInputProps> = ({ onUrlSubmit, title, subtitle }) => {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);

  const validateUrl = (inputUrl: string) => {
    try {
      new URL(inputUrl);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputUrl = e.target.value;
    setUrl(inputUrl);
    setIsValidUrl(validateUrl(inputUrl));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidUrl) {
      onUrlSubmit(url);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="border-2 border-dashed border-blueprint-600 rounded-2xl p-12 text-center hover:border-blueprint-500 transition-colors">
        <div className="space-y-6">
          <div className="inline-flex p-6 bg-accent-cyan/10 rounded-2xl">
            <Globe className="h-12 w-12 text-blueprint-400" strokeWidth={1} />
          </div>
          
          <div>
            <h3 className="text-2xl font-semibold text-blueprint-100 mb-2">{title}</h3>
            <p className="text-blueprint-400 mb-6">{subtitle}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="flex gap-3">
              <input
                type="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://example.com"
                className="flex-1 px-4 py-3 bg-blueprint-800 border border-blueprint-700 rounded-xl text-blueprint-100 placeholder-blueprint-500 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan"
              />
              <button
                type="submit"
                disabled={!isValidUrl}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 ${
                  isValidUrl
                    ? 'bg-accent-cyan text-blueprint-900 hover:bg-accent-cyan/90 hover:scale-105'
                    : 'bg-blueprint-700 text-blueprint-400 cursor-not-allowed'
                }`}
              >
                <span>Convert</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            {url && !isValidUrl && (
              <p className="text-red-400 text-sm mt-2 text-left">Please enter a valid URL</p>
            )}
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default URLInput;