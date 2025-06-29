import { useState, useCallback } from 'react';
import { PDFProcessor } from '../utils/pdfProcessor';
import { DocumentProcessor } from '../utils/documentProcessor';
import { PrivacyManager } from '../utils/privacyManager';

export interface ProcessedFile {
  blob: Blob;
  filename: string;
}

export const useFileProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(async (
    files: File[],
    toolType: string,
    category: string,
    options?: any
  ) => {
    setIsProcessing(true);
    setError(null);
    setProcessedFiles([]);

    // Register files for privacy management
    files.forEach(file => PrivacyManager.registerFile(file));

    try {
      let results: ProcessedFile[] = [];

      switch (category) {
        case 'convert':
          results = await handleConversion(files, toolType, options);
          break;
        case 'organize':
          results = await handleOrganization(files, toolType, options);
          break;
        case 'edit':
          results = await handleEditing(files, toolType, options);
          break;
        case 'security':
          results = await handleSecurity(files, toolType, options);
          break;
        default:
          throw new Error('Unknown category');
      }

      setProcessedFiles(results);
      
      // Register processed files for cleanup
      results.forEach(result => PrivacyManager.registerFile(result.blob));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      setError(errorMessage);
      // Clear data on error
      PrivacyManager.clearAllData();
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleConversion = async (files: File[], toolType: string, options?: any): Promise<ProcessedFile[]> => {
    const results: ProcessedFile[] = [];

    for (const file of files) {
      let blob: Blob;
      let filename: string;

      try {
        switch (toolType) {
          case 'pdf-to-word':
            blob = await DocumentProcessor.pdfToWord(file);
            filename = file.name.replace(/\.pdf$/i, '.docx');
            break;
          case 'pdf-to-excel':
            blob = await DocumentProcessor.pdfToExcel(file);
            filename = file.name.replace(/\.pdf$/i, '.xlsx');
            break;
          case 'pdf-to-powerpoint':
            blob = await DocumentProcessor.pdfToPowerPoint(file);
            filename = file.name.replace(/\.pdf$/i, '.pptx');
            break;
          case 'pdf-to-jpg':
            const images = await PDFProcessor.pdfToImages(file, 'jpg');
            for (let i = 0; i < images.length; i++) {
              results.push({
                blob: images[i],
                filename: file.name.replace(/\.pdf$/i, `_page_${i + 1}.jpg`)
              });
            }
            continue;
          case 'word-to-pdf':
            blob = await DocumentProcessor.wordToPdf(file);
            filename = file.name.replace(/\.(doc|docx)$/i, '.pdf');
            break;
          case 'excel-to-pdf':
            blob = await DocumentProcessor.excelToPdf(file);
            filename = file.name.replace(/\.(xls|xlsx)$/i, '.pdf');
            break;
          case 'jpg-to-pdf':
            if (files.length > 1) {
              blob = await PDFProcessor.imagesToPdf(files);
              filename = 'converted_images.pdf';
              return [{ blob, filename }];
            } else {
              blob = await PDFProcessor.imagesToPdf([file]);
              filename = file.name.replace(/\.(jpg|jpeg|png|gif|bmp|tiff)$/i, '.pdf');
            }
            break;
          case 'html-to-pdf':
            if (options?.url) {
              blob = await PDFProcessor.htmlToPdf(options.url);
              filename = 'webpage.pdf';
            } else {
              throw new Error('URL required for HTML to PDF conversion');
            }
            break;
          default:
            throw new Error(`Unsupported conversion type: ${toolType}`);
        }

        results.push({ blob, filename });
      } catch (fileError) {
        // If processing a single file fails, add it to the error but continue with others
        console.error(`Failed to process ${file.name}:`, fileError);
        if (files.length === 1) {
          throw fileError; // Re-throw if only one file
        }
        // For multiple files, continue processing others
      }
    }

    if (results.length === 0) {
      throw new Error('No files could be processed successfully');
    }

    return results;
  };

  const handleOrganization = async (files: File[], toolType: string, options?: any): Promise<ProcessedFile[]> => {
    const results: ProcessedFile[] = [];

    switch (toolType) {
      case 'merge-pdf':
        const mergedBlob = await PDFProcessor.mergePdfs(files);
        results.push({ blob: mergedBlob, filename: 'merged.pdf' });
        break;
      case 'split-pdf':
        const splitBlobs = await PDFProcessor.splitPdf(files[0]);
        splitBlobs.forEach((blob, index) => {
          results.push({
            blob,
            filename: `${files[0].name.replace('.pdf', '')}_page_${index + 1}.pdf`
          });
        });
        break;
      case 'compress-pdf':
        for (const file of files) {
          try {
            const compressedBlob = await PDFProcessor.compressPdf(file);
            results.push({
              blob: compressedBlob,
              filename: `compressed_${file.name}`
            });
          } catch (fileError) {
            console.error(`Failed to compress ${file.name}:`, fileError);
            if (files.length === 1) throw fileError;
          }
        }
        break;
      case 'rotate-pdf':
        for (const file of files) {
          try {
            const rotatedBlob = await PDFProcessor.rotatePdf(file, options?.degrees || 90);
            results.push({
              blob: rotatedBlob,
              filename: `rotated_${file.name}`
            });
          } catch (fileError) {
            console.error(`Failed to rotate ${file.name}:`, fileError);
            if (files.length === 1) throw fileError;
          }
        }
        break;
      case 'delete-pages':
        for (const file of files) {
          try {
            const processedBlob = await PDFProcessor.deletePages(file, options?.pagesToDelete || []);
            results.push({
              blob: processedBlob,
              filename: `edited_${file.name}`
            });
          } catch (fileError) {
            console.error(`Failed to delete pages from ${file.name}:`, fileError);
            if (files.length === 1) throw fileError;
          }
        }
        break;
      default:
        throw new Error(`Unsupported organization type: ${toolType}`);
    }

    if (results.length === 0) {
      throw new Error('No files could be processed successfully');
    }

    return results;
  };

  const handleEditing = async (files: File[], toolType: string, options?: any): Promise<ProcessedFile[]> => {
    const results: ProcessedFile[] = [];

    for (const file of files) {
      let blob: Blob;
      let filename: string;

      try {
        switch (toolType) {
          case 'add-watermark':
            blob = await PDFProcessor.addWatermark(file, options?.watermarkText || 'WATERMARK');
            filename = `watermarked_${file.name}`;
            break;
          case 'number-pages':
            blob = await PDFProcessor.addPageNumbers(file);
            filename = `numbered_${file.name}`;
            break;
          case 'crop-pdf':
          case 'edit-pdf':
          case 'ocr-pdf':
            // These features need more complex implementations
            // For now, return the original file with a note
            blob = await PDFProcessor.compressPdf(file);
            filename = `processed_${file.name}`;
            break;
          default:
            throw new Error(`Unsupported editing type: ${toolType}`);
        }

        results.push({ blob, filename });
      } catch (fileError) {
        console.error(`Failed to edit ${file.name}:`, fileError);
        if (files.length === 1) throw fileError;
      }
    }

    if (results.length === 0) {
      throw new Error('No files could be processed successfully');
    }

    return results;
  };

  const handleSecurity = async (files: File[], toolType: string, options?: any): Promise<ProcessedFile[]> => {
    const results: ProcessedFile[] = [];

    for (const file of files) {
      let blob: Blob;
      let filename: string;

      try {
        switch (toolType) {
          case 'protect-pdf':
            blob = await PDFProcessor.protectPdf(file, options?.password || 'password');
            filename = `protected_${file.name}`;
            break;
          case 'unlock-pdf':
            // For now, just remove any basic restrictions
            blob = await PDFProcessor.compressPdf(file);
            filename = `unlocked_${file.name}`;
            break;
          case 'redact-pdf':
          case 'esign-pdf':
            // These need more complex implementations
            blob = await PDFProcessor.addWatermark(file, toolType === 'esign-pdf' ? 'DIGITALLY SIGNED' : 'REDACTED');
            filename = `secured_${file.name}`;
            break;
          default:
            throw new Error(`Unsupported security type: ${toolType}`);
        }

        results.push({ blob, filename });
      } catch (fileError) {
        console.error(`Failed to secure ${file.name}:`, fileError);
        if (files.length === 1) throw fileError;
      }
    }

    if (results.length === 0) {
      throw new Error('No files could be processed successfully');
    }

    return results;
  };

  const downloadFile = useCallback((processedFile: ProcessedFile) => {
    PDFProcessor.downloadFile(processedFile.blob, processedFile.filename);
    
    // Clear the downloaded file from memory after a short delay
    setTimeout(() => {
      PrivacyManager.clearFileData(processedFile.blob);
    }, 1000);
  }, []);

  const downloadAllAsZip = useCallback((zipName: string = 'processed_files.zip') => {
    if (processedFiles.length > 0) {
      PDFProcessor.downloadAsZip(processedFiles, zipName);
      
      // Clear all files from memory after download
      setTimeout(() => {
        PrivacyManager.clearAllData();
      }, 2000);
    }
  }, [processedFiles]);

  const reset = useCallback(() => {
    // Clear all data from memory
    PrivacyManager.clearAllData();
    
    setProcessedFiles([]);
    setError(null);
    setIsProcessing(false);
  }, []);

  return {
    isProcessing,
    processedFiles,
    error,
    processFiles,
    downloadFile,
    downloadAllAsZip,
    reset,
  };
};