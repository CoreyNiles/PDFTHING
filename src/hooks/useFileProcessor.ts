import { useState, useCallback } from 'react';
import { PDFProcessor } from '../utils/pdfProcessor';
import { DocumentProcessor } from '../utils/documentProcessor';

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleConversion = async (files: File[], toolType: string, options?: any): Promise<ProcessedFile[]> => {
    const results: ProcessedFile[] = [];

    for (const file of files) {
      let blob: Blob;
      let filename: string;

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
          // Handle multiple images to single PDF
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
          const compressedBlob = await PDFProcessor.compressPdf(file);
          results.push({
            blob: compressedBlob,
            filename: `compressed_${file.name}`
          });
        }
        break;
      case 'rotate-pdf':
        for (const file of files) {
          const rotatedBlob = await PDFProcessor.rotatePdf(file, options?.degrees || 90);
          results.push({
            blob: rotatedBlob,
            filename: `rotated_${file.name}`
          });
        }
        break;
      case 'delete-pages':
        for (const file of files) {
          const processedBlob = await PDFProcessor.deletePages(file, options?.pagesToDelete || []);
          results.push({
            blob: processedBlob,
            filename: `edited_${file.name}`
          });
        }
        break;
      default:
        throw new Error(`Unsupported organization type: ${toolType}`);
    }

    return results;
  };

  const handleEditing = async (files: File[], toolType: string, options?: any): Promise<ProcessedFile[]> => {
    const results: ProcessedFile[] = [];

    for (const file of files) {
      let blob: Blob;
      let filename: string;

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
          // These would require more complex implementations
          blob = await PDFProcessor.compressPdf(file); // Placeholder
          filename = `edited_${file.name}`;
          break;
        default:
          throw new Error(`Unsupported editing type: ${toolType}`);
      }

      results.push({ blob, filename });
    }

    return results;
  };

  const handleSecurity = async (files: File[], toolType: string, options?: any): Promise<ProcessedFile[]> => {
    const results: ProcessedFile[] = [];

    for (const file of files) {
      let blob: Blob;
      let filename: string;

      switch (toolType) {
        case 'protect-pdf':
          blob = await PDFProcessor.protectPdf(file, options?.password || 'password');
          filename = `protected_${file.name}`;
          break;
        case 'unlock-pdf':
          // This would require password verification
          blob = await PDFProcessor.compressPdf(file); // Placeholder
          filename = `unlocked_${file.name}`;
          break;
        case 'redact-pdf':
        case 'esign-pdf':
          // These would require more complex implementations
          blob = await PDFProcessor.compressPdf(file); // Placeholder
          filename = `secured_${file.name}`;
          break;
        default:
          throw new Error(`Unsupported security type: ${toolType}`);
      }

      results.push({ blob, filename });
    }

    return results;
  };

  const downloadFile = useCallback((processedFile: ProcessedFile) => {
    PDFProcessor.downloadFile(processedFile.blob, processedFile.filename);
  }, []);

  const downloadAllAsZip = useCallback((zipName: string = 'processed_files.zip') => {
    if (processedFiles.length > 0) {
      PDFProcessor.downloadAsZip(processedFiles, zipName);
    }
  }, [processedFiles]);

  const reset = useCallback(() => {
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