import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, X } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  acceptedFormats: string[];
  maxFiles: number;
  title: string;
  subtitle: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  acceptedFormats,
  maxFiles,
  title,
  subtitle,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      acceptedFormats.some(format => 
        file.type.includes(format.replace('.', '')) || 
        file.name.toLowerCase().endsWith(format.toLowerCase())
      )
    ).slice(0, maxFiles);
    
    setSelectedFiles(validFiles);
    onFilesSelected(validFiles);
  }, [acceptedFormats, maxFiles, onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.slice(0, maxFiles);
    setSelectedFiles(validFiles);
    onFilesSelected(validFiles);
  }, [maxFiles, onFilesSelected]);

  const removeFile = useCallback((index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  }, [selectedFiles, onFilesSelected]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
          dragActive
            ? 'border-accent-cyan bg-accent-cyan/5 scale-105'
            : 'border-blueprint-600 hover:border-blueprint-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple={maxFiles > 1}
          accept={acceptedFormats.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-6">
          <div className="inline-flex p-6 bg-accent-cyan/10 rounded-2xl">
            <Upload className={`h-12 w-12 transition-colors ${
              dragActive ? 'text-accent-cyan' : 'text-blueprint-400'
            }`} strokeWidth={1} />
          </div>
          
          <div>
            <h3 className="text-2xl font-semibold text-blueprint-100 mb-2">{title}</h3>
            <p className="text-blueprint-400 mb-4">{subtitle}</p>
            <p className="text-sm text-blueprint-500">
              Supported formats: {acceptedFormats.join(', ')} • Max {maxFiles} file{maxFiles !== 1 ? 's' : ''}
            </p>
          </div>
          
          <button
            type="button"
            className="px-8 py-3 bg-accent-cyan text-blueprint-900 rounded-xl font-semibold hover:bg-accent-cyan/90 transition-all duration-200 hover:scale-105"
          >
            Choose Files
          </button>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 space-y-3"
        >
          <h4 className="text-lg font-semibold text-blueprint-100">Selected Files</h4>
          {selectedFiles.map((file, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between bg-blueprint-800 rounded-lg p-4 border border-blueprint-700"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-accent-cyan/10 rounded-lg">
                  <File className="h-5 w-5 text-accent-cyan" strokeWidth={1} />
                </div>
                <div>
                  <p className="font-medium text-blueprint-100">{file.name}</p>
                  <p className="text-sm text-blueprint-400">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-2 text-blueprint-400 hover:text-blueprint-200 hover:bg-blueprint-700 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default FileUpload;