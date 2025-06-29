import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Info } from 'lucide-react';

interface ConversionLimitationsNoticeProps {
  toolType: string;
  isVisible: boolean;
}

const ConversionLimitationsNotice: React.FC<ConversionLimitationsNoticeProps> = ({ toolType, isVisible }) => {
  if (!isVisible) return null;

  const getNoticeContent = () => {
    switch (toolType) {
      case 'pdf-to-word':
      case 'pdf-to-excel':
      case 'pdf-to-powerpoint':
        return {
          type: 'warning',
          title: 'Formatting Limitations',
          content: [
            'This conversion extracts text content only',
            'Images, charts, tables, and complex formatting will not be preserved',
            'For best results with formatted documents, use the original application\'s export feature',
            'Scanned PDFs require OCR processing for text extraction'
          ]
        };
      
      case 'word-to-pdf':
      case 'excel-to-pdf':
      case 'powerpoint-to-pdf':
        return {
          type: 'info',
          title: 'Text-Based Conversion',
          content: [
            'This tool creates text-based PDFs from your documents',
            'Basic formatting is preserved where possible',
            'Images and complex layouts may not transfer perfectly',
            'For full fidelity, use your application\'s built-in PDF export'
          ]
        };
      
      case 'html-to-pdf':
        return {
          type: 'warning',
          title: 'Web Page Conversion Notice',
          content: [
            'Some websites may block automated capture due to security policies',
            'Dynamic content and interactive elements will not be preserved',
            'Large or complex pages may take longer to process',
            'For best results, try the browser\'s "Print to PDF" feature'
          ]
        };
      
      default:
        return null;
    }
  };

  const notice = getNoticeContent();
  if (!notice) return null;

  const isWarning = notice.type === 'warning';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 p-4 rounded-lg border ${
        isWarning 
          ? 'bg-yellow-900/20 border-yellow-700/30 text-yellow-200' 
          : 'bg-blue-900/20 border-blue-700/30 text-blue-200'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {isWarning ? (
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          ) : (
            <Info className="h-5 w-5 text-blue-400" />
          )}
        </div>
        <div>
          <h4 className="font-semibold mb-2">{notice.title}</h4>
          <ul className="space-y-1 text-sm">
            {notice.content.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default ConversionLimitationsNotice;