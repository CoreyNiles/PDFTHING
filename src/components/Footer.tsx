import React from 'react';
import { FileText, Shield, Zap, Users, Lock, Trash2 } from 'lucide-react';

const Footer: React.FC = () => {
  const features = [
    { 
      icon: Shield, 
      title: '100% Client-Side Processing', 
      desc: 'All files are processed locally in your browser - never uploaded to servers' 
    },
    { 
      icon: Trash2, 
      title: 'Immediate Data Deletion', 
      desc: 'Files are automatically cleared from memory after processing for maximum privacy' 
    },
    { 
      icon: Zap, 
      title: 'Lightning Fast & Free', 
      desc: 'No accounts, no limits, no costs - professional tools available instantly' 
    },
  ];

  return (
    <footer className="bg-blueprint-950 border-t border-blueprint-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Privacy Guarantee Banner */}
        <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <Lock className="h-6 w-6 text-green-400" />
            <h3 className="text-xl font-bold text-green-400">Privacy Guarantee</h3>
          </div>
          <p className="text-center text-blueprint-200 leading-relaxed">
            Your files <strong>never leave your device</strong>. All processing happens locally in your browser using advanced client-side libraries. 
            Files are automatically deleted from memory immediately after download. No servers, no storage, no tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="p-2 bg-accent-cyan/10 rounded-lg">
                <feature.icon className="h-5 w-5 text-accent-cyan" strokeWidth={1} />
              </div>
              <div>
                <h3 className="font-semibold text-blueprint-100 mb-1">{feature.title}</h3>
                <p className="text-sm text-blueprint-400">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Technical Details */}
        <div className="bg-blueprint-900 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-blueprint-100 mb-4 text-center">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blueprint-300">
            <div>
              <h4 className="font-medium text-blueprint-200 mb-2">Client-Side Libraries Used:</h4>
              <ul className="space-y-1">
                <li>• PDF-lib for PDF manipulation</li>
                <li>• PDF.js for PDF reading</li>
                <li>• Mammoth.js for Word processing</li>
                <li>• XLSX for Excel handling</li>
                <li>• Tesseract.js for OCR</li>
                <li>• HTML2Canvas for web capture</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blueprint-200 mb-2">Privacy Features:</h4>
              <ul className="space-y-1">
                <li>• No file uploads to servers</li>
                <li>• Automatic memory cleanup</li>
                <li>• No user accounts required</li>
                <li>• No data collection or tracking</li>
                <li>• Works offline after initial load</li>
                <li>• Open source transparency</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-blueprint-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="p-2 bg-accent-cyan/10 rounded-lg">
              <FileText className="h-5 w-5 text-accent-cyan" strokeWidth={1} />
            </div>
            <span className="text-lg font-semibold text-blueprint-100">
              PDFTools <span className="text-accent-cyan">Pro</span>
            </span>
          </div>
          <div className="text-sm text-blueprint-400">
            © 2025 PDFTools Pro. Privacy-first PDF processing.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;