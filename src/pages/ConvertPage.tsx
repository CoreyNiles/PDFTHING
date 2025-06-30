import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import FileUpload from '../components/FileUpload';
import URLInput from '../components/URLInput';
import ToolHeader from '../components/ToolHeader';
import ProcessingStatus from '../components/ProcessingStatus';
import ConversionLimitationsNotice from '../components/ConversionLimitationsNotice';
import { getToolConfig } from '../utils/toolConfig';
import { useFileProcessor } from '../hooks/useFileProcessor';
import { Download, Package, AlertCircle } from 'lucide-react';

const ConvertPage: React.FC = () => {
  const { toolType } = useParams<{ toolType: string }>();
  const [files, setFiles] = useState<File[]>([]);
  const [urlInput, setUrlInput] = useState<string>('');
  
  const { isProcessing, processedFiles, error, processFiles, downloadFile, downloadAllAsZip, reset } = useFileProcessor();
  const toolConfig = getToolConfig('convert', toolType || '');

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setUrlInput('');
    reset();
  }, [reset]);

  const handleUrlSubmit = useCallback((submittedUrl: string) => {
    setUrlInput(submittedUrl);
    setFiles([]);
    reset();
  }, [reset]);

  const handleConvert = useCallback(async () => {
    if (files.length === 0 && !urlInput) return;

    const options = urlInput ? { url: urlInput } : undefined;
    const filesToProcess = urlInput ? [] : files;
    
    await processFiles(filesToProcess, toolType || '', 'convert', options);
  }, [files, urlInput, toolType, processFiles]);

  if (!toolConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blueprint-100 mb-2">Tool Not Found</h1>
          <p className="text-blueprint-400">The requested conversion tool could not be found.</p>
        </div>
      </div>
    );
  }

  const isUrlToPdf = toolType === 'url-to-pdf';
  const showLimitations = !isProcessing && processedFiles.length === 0;

  return (
    <div className="min-h-screen bg-blueprint-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ToolHeader 
          title={toolConfig.title}
          description={toolConfig.description}
          icon={toolConfig.icon}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8"
        >
          {/* Show limitations notice */}
          <ConversionLimitationsNotice 
            toolType={toolType || ''} 
            isVisible={showLimitations}
          />

          {!isProcessing && processedFiles.length === 0 && (
            <>
              {isUrlToPdf ? (
                <URLInput
                  onUrlSubmit={handleUrlSubmit}
                  title="Convert Website to PDF"
                  subtitle="Enter a website URL to convert to PDF"
                />
              ) : (
                <FileUpload
                  onFilesSelected={handleFilesSelected}
                  acceptedFormats={toolConfig.acceptedFormats}
                  maxFiles={toolConfig.maxFiles}
                  title="Select Files to Convert"
                  subtitle={`Drag and drop your ${toolConfig.acceptedFormats.join(', ')} files here`}
                />
              )}
            </>
          )}

          {(files.length > 0 || urlInput) && !isProcessing && processedFiles.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center"
            >
              <div className="bg-blueprint-800 rounded-2xl p-8 border border-blueprint-700">
                <h3 className="text-xl font-semibold text-blueprint-100 mb-4">
                  Ready to Convert
                </h3>
                <p className="text-blueprint-400 mb-6">
                  {urlInput ? (
                    <>URL: <span className="text-accent-cyan break-all">{urlInput}</span></>
                  ) : (
                    `${files.length} file${files.length !== 1 ? 's' : ''} selected for conversion`
                  )}
                </p>
                <button
                  onClick={handleConvert}
                  className="px-8 py-4 bg-accent-cyan text-blueprint-900 rounded-xl font-semibold hover:bg-accent-cyan/90 transition-all duration-200 hover:scale-105"
                >
                  Convert to {toolConfig.outputFormat?.toUpperCase() || 'PDF'}
                </button>
              </div>
            </motion.div>
          )}

          {isProcessing && (
            <ProcessingStatus 
              message="Converting your files..."
              subMessage="Processing files locally in your browser"
            />
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <div className="bg-red-900/20 border border-red-700 rounded-2xl p-8 text-center">
                <div className="inline-flex p-4 bg-red-500/10 rounded-2xl mb-4">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-red-400 mb-4">
                  Conversion Failed
                </h3>
                <p className="text-red-300 mb-6 leading-relaxed">{error}</p>
                
                {/* Helpful suggestions based on error type */}
                {error.includes('No readable text') && (
                  <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
                    <h4 className="text-blue-400 font-medium mb-2">Suggestion:</h4>
                    <p className="text-blue-300 text-sm">
                      This appears to be a scanned PDF. Try using the <strong>OCR PDF</strong> tool first to extract text from images.
                    </p>
                  </div>
                )}
                
                {error.includes('password') && (
                  <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
                    <h4 className="text-blue-400 font-medium mb-2">Suggestion:</h4>
                    <p className="text-blue-300 text-sm">
                      This PDF is password-protected. Use the <strong>Unlock PDF</strong> tool first to remove protection.
                    </p>
                  </div>
                )}
                
                {error.includes('CORS') && (
                  <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
                    <h4 className="text-blue-400 font-medium mb-2">Suggestion:</h4>
                    <p className="text-blue-300 text-sm">
                      This website blocks automated capture. Try using your browser's "Print to PDF" feature instead.
                    </p>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setFiles([]);
                    setUrlInput('');
                    reset();
                  }}
                  className="px-6 py-3 bg-blueprint-700 text-blueprint-100 rounded-lg font-medium hover:bg-blueprint-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}

          {processedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <div className="bg-blueprint-800 rounded-2xl p-8 border border-blueprint-700 text-center">
                <div className="inline-flex p-4 bg-green-500/10 rounded-2xl mb-6">
                  <toolConfig.icon className="h-8 w-8 text-green-400" strokeWidth={1} />
                </div>
                <h3 className="text-xl font-semibold text-blueprint-100 mb-4">
                  Conversion Complete!
                </h3>
                <p className="text-blueprint-400 mb-6">
                  Your files have been successfully converted
                </p>
                
                {processedFiles.length > 1 && (
                  <div className="mb-6">
                    <button
                      onClick={() => downloadAllAsZip('converted_files.zip')}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors inline-flex items-center space-x-2"
                    >
                      <Package className="h-4 w-4" />
                      <span>Download All as ZIP</span>
                    </button>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {processedFiles.map((processedFile, index) => (
                    <div key={index} className="flex items-center justify-between bg-blueprint-900 rounded-lg p-4 border border-blueprint-700">
                      <span className="text-blueprint-200 font-medium truncate mr-4">{processedFile.filename}</span>
                      <button 
                        onClick={() => downloadFile(processedFile)}
                        className="px-4 py-2 bg-accent-cyan text-blueprint-900 rounded-lg font-medium hover:bg-accent-cyan/90 transition-colors inline-flex items-center space-x-2 flex-shrink-0"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setFiles([]);
                    setUrlInput('');
                    reset();
                  }}
                  className="px-6 py-3 bg-blueprint-700 text-blueprint-100 rounded-lg font-medium hover:bg-blueprint-600 transition-colors"
                >
                  Convert More Files
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ConvertPage;