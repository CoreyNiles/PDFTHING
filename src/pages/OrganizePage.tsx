import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import FileUpload from '../components/FileUpload';
import ToolHeader from '../components/ToolHeader';
import ProcessingStatus from '../components/ProcessingStatus';
import { getToolConfig } from '../utils/toolConfig';
import { useFileProcessor } from '../hooks/useFileProcessor';
import { Download, Package } from 'lucide-react';

const OrganizePage: React.FC = () => {
  const { toolType } = useParams<{ toolType: string }>();
  const [files, setFiles] = useState<File[]>([]);
  
  const { isProcessing, processedFiles, error, processFiles, downloadFile, downloadAllAsZip, reset } = useFileProcessor();
  const toolConfig = getToolConfig('organize', toolType || '');

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles);
    reset();
  }, [reset]);

  const handleProcess = useCallback(async () => {
    if (files.length === 0) return;
    await processFiles(files, toolType || '', 'organize');
  }, [files, toolType, processFiles]);

  if (!toolConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blueprint-100 mb-2">Tool Not Found</h1>
          <p className="text-blueprint-400">The requested organization tool could not be found.</p>
        </div>
      </div>
    );
  }

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
          {!isProcessing && processedFiles.length === 0 && (
            <FileUpload
              onFilesSelected={handleFilesSelected}
              acceptedFormats={toolConfig.acceptedFormats}
              maxFiles={toolConfig.maxFiles}
              title="Select PDF Files"
              subtitle={`Upload your PDF files to ${toolConfig.title.toLowerCase()}`}
            />
          )}

          {files.length > 0 && !isProcessing && processedFiles.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center"
            >
              <div className="bg-blueprint-800 rounded-2xl p-8 border border-blueprint-700">
                <h3 className="text-xl font-semibold text-blueprint-100 mb-4">
                  Ready to Process
                </h3>
                <p className="text-blueprint-400 mb-6">
                  {files.length} PDF file{files.length !== 1 ? 's' : ''} selected
                </p>
                <button
                  onClick={handleProcess}
                  className="px-8 py-4 bg-accent-cyan text-blueprint-900 rounded-xl font-semibold hover:bg-accent-cyan/90 transition-all duration-200 hover:scale-105"
                >
                  {toolConfig.actionText || 'Process Files'}
                </button>
              </div>
            </motion.div>
          )}

          {isProcessing && (
            <ProcessingStatus 
              message={`${toolConfig.title} in progress...`}
              subMessage="Processing your PDF files locally"
            />
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <div className="bg-red-900/20 border border-red-700 rounded-2xl p-8 text-center">
                <h3 className="text-xl font-semibold text-red-400 mb-4">
                  Processing Failed
                </h3>
                <p className="text-red-300 mb-6">{error}</p>
                <button
                  onClick={() => {
                    setFiles([]);
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
                  Processing Complete!
                </h3>
                <p className="text-blueprint-400 mb-6">
                  Your PDF files have been successfully processed
                </p>
                
                {processedFiles.length > 1 && (
                  <div className="mb-6">
                    <button
                      onClick={() => downloadAllAsZip('organized_files.zip')}
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
                      <span className="text-blueprint-200 font-medium">{processedFile.filename}</span>
                      <button 
                        onClick={() => downloadFile(processedFile)}
                        className="px-4 py-2 bg-accent-cyan text-blueprint-900 rounded-lg font-medium hover:bg-accent-cyan/90 transition-colors inline-flex items-center space-x-2"
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
                    reset();
                  }}
                  className="px-6 py-3 bg-blueprint-700 text-blueprint-100 rounded-lg font-medium hover:bg-blueprint-600 transition-colors"
                >
                  Process More Files
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default OrganizePage;