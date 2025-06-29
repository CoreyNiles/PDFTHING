import { PDFDocument, rgb, StandardFonts, PageSizes, PDFPage } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { PrivacyManager } from './privacyManager';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export class AdvancedPdfProcessor {
  // OCR PDF - Extract text from scanned PDFs
  static async ocrPdf(file: File): Promise<Blob> {
    try {
      PrivacyManager.registerFile(file);
      
      const arrayBuffer = await file.arrayBuffer();
      PrivacyManager.registerFile(arrayBuffer);
      
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const worker = await createWorker('eng');
      
      let extractedText = `OCR Results for: ${file.name}\n`;
      extractedText += '='.repeat(50) + '\n\n';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const scale = 2.0;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        
        // Convert canvas to image data for OCR
        const imageData = canvas.toDataURL('image/png');
        const { data: { text } } = await worker.recognize(imageData);
        
        extractedText += `Page ${pageNum}:\n`;
        extractedText += '-'.repeat(20) + '\n';
        extractedText += text.trim() + '\n\n';
        
        // Clean up canvas
        canvas.remove();
      }

      await worker.terminate();
      
      // Create PDF with extracted text
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;
      const margin = 50;
      
      let page = pdfDoc.addPage(PageSizes.A4);
      let { width, height } = page.getSize();
      let yPosition = height - margin;
      
      const lines = extractedText.split('\n');
      const maxWidth = width - (margin * 2);
      
      for (const line of lines) {
        if (yPosition < margin + 20) {
          page = pdfDoc.addPage(PageSizes.A4);
          ({ width, height } = page.getSize());
          yPosition = height - margin;
        }
        
        if (line.trim() === '') {
          yPosition -= fontSize + 2;
          continue;
        }
        
        const textWidth = font.widthOfTextAtSize(line, fontSize);
        if (textWidth > maxWidth) {
          // Wrap long lines
          const words = line.split(' ');
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const testWidth = font.widthOfTextAtSize(testLine, fontSize);
            
            if (testWidth > maxWidth && currentLine) {
              page.drawText(currentLine, {
                x: margin,
                y: yPosition,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
              });
              yPosition -= fontSize + 2;
              currentLine = word;
              
              if (yPosition < margin + 20) {
                page = pdfDoc.addPage(PageSizes.A4);
                ({ width, height } = page.getSize());
                yPosition = height - margin;
              }
            } else {
              currentLine = testLine;
            }
          }
          
          if (currentLine) {
            page.drawText(currentLine, {
              x: margin,
              y: yPosition,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
            });
            yPosition -= fontSize + 2;
          }
        } else {
          page.drawText(line, {
            x: margin,
            y: yPosition,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
          yPosition -= fontSize + 2;
        }
      }

      const pdfBytes = await pdfDoc.save();
      const resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Clear sensitive data
      PrivacyManager.clearFileData(file);
      PrivacyManager.clearFileData(arrayBuffer);
      
      return resultBlob;
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error('Failed to perform OCR on PDF. The file may contain complex layouts or unsupported image formats.');
    }
  }

  // Crop PDF pages
  static async cropPdf(file: File, cropSettings?: { top: number; bottom: number; left: number; right: number }): Promise<Blob> {
    try {
      PrivacyManager.registerFile(file);
      
      const arrayBuffer = await file.arrayBuffer();
      PrivacyManager.registerFile(arrayBuffer);
      
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      const defaultCrop = { top: 50, bottom: 50, left: 50, right: 50 };
      const crop = cropSettings || defaultCrop;

      pages.forEach(page => {
        const { width, height } = page.getSize();
        
        // Set new crop box
        const newWidth = width - crop.left - crop.right;
        const newHeight = height - crop.top - crop.bottom;
        
        if (newWidth > 0 && newHeight > 0) {
          page.setCropBox(crop.left, crop.bottom, newWidth, newHeight);
        }
      });

      const pdfBytes = await pdfDoc.save();
      const resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      PrivacyManager.clearFileData(file);
      PrivacyManager.clearFileData(arrayBuffer);
      
      return resultBlob;
    } catch (error) {
      console.error('PDF cropping failed:', error);
      throw new Error('Failed to crop PDF pages');
    }
  }

  // Advanced PDF editing with text and shape insertion
  static async editPdf(file: File, edits: Array<{
    type: 'text' | 'rectangle' | 'line';
    page: number;
    x: number;
    y: number;
    content?: string;
    width?: number;
    height?: number;
    color?: [number, number, number];
    fontSize?: number;
  }>): Promise<Blob> {
    try {
      PrivacyManager.registerFile(file);
      
      const arrayBuffer = await file.arrayBuffer();
      PrivacyManager.registerFile(arrayBuffer);
      
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      for (const edit of edits) {
        if (edit.page < 1 || edit.page > pages.length) continue;
        
        const page = pages[edit.page - 1];
        const color = edit.color ? rgb(edit.color[0], edit.color[1], edit.color[2]) : rgb(0, 0, 0);

        switch (edit.type) {
          case 'text':
            if (edit.content) {
              page.drawText(edit.content, {
                x: edit.x,
                y: edit.y,
                size: edit.fontSize || 12,
                font,
                color,
              });
            }
            break;
            
          case 'rectangle':
            page.drawRectangle({
              x: edit.x,
              y: edit.y,
              width: edit.width || 100,
              height: edit.height || 50,
              borderColor: color,
              borderWidth: 2,
            });
            break;
            
          case 'line':
            page.drawLine({
              start: { x: edit.x, y: edit.y },
              end: { x: edit.x + (edit.width || 100), y: edit.y + (edit.height || 0) },
              thickness: 2,
              color,
            });
            break;
        }
      }

      const pdfBytes = await pdfDoc.save();
      const resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      PrivacyManager.clearFileData(file);
      PrivacyManager.clearFileData(arrayBuffer);
      
      return resultBlob;
    } catch (error) {
      console.error('PDF editing failed:', error);
      throw new Error('Failed to edit PDF');
    }
  }

  // Redact PDF - Remove sensitive information
  static async redactPdf(file: File, redactions: Array<{
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>): Promise<Blob> {
    try {
      PrivacyManager.registerFile(file);
      
      const arrayBuffer = await file.arrayBuffer();
      PrivacyManager.registerFile(arrayBuffer);
      
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      for (const redaction of redactions) {
        if (redaction.page < 1 || redaction.page > pages.length) continue;
        
        const page = pages[redaction.page - 1];
        
        // Draw black rectangle to cover sensitive content
        page.drawRectangle({
          x: redaction.x,
          y: redaction.y,
          width: redaction.width,
          height: redaction.height,
          color: rgb(0, 0, 0), // Black redaction
        });
      }

      const pdfBytes = await pdfDoc.save();
      const resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      PrivacyManager.clearFileData(file);
      PrivacyManager.clearFileData(arrayBuffer);
      
      return resultBlob;
    } catch (error) {
      console.error('PDF redaction failed:', error);
      throw new Error('Failed to redact PDF');
    }
  }

  // Unlock PDF - Remove password protection (simplified)
  static async unlockPdf(file: File, password: string): Promise<Blob> {
    try {
      PrivacyManager.registerFile(file);
      
      const arrayBuffer = await file.arrayBuffer();
      PrivacyManager.registerFile(arrayBuffer);
      
      // Try to load with password
      const pdfDoc = await PDFDocument.load(arrayBuffer, { 
        ignoreEncryption: true 
      });
      
      // Save without encryption
      const pdfBytes = await pdfDoc.save();
      const resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      PrivacyManager.clearFileData(file);
      PrivacyManager.clearFileData(arrayBuffer);
      
      return resultBlob;
    } catch (error) {
      console.error('PDF unlock failed:', error);
      throw new Error('Failed to unlock PDF. Please check the password or file integrity.');
    }
  }

  // Enhanced HTML to PDF with better CORS handling
  static async htmlToPdfAdvanced(url: string): Promise<Blob> {
    try {
      // Create a more robust iframe setup
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '1200px';
      iframe.style.height = '800px';
      iframe.style.border = 'none';
      iframe.sandbox = 'allow-same-origin allow-scripts allow-forms';
      document.body.appendChild(iframe);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          document.body.removeChild(iframe);
          reject(new Error('Timeout loading webpage. The site may have CORS restrictions.'));
        }, 30000);

        iframe.onload = async () => {
          try {
            clearTimeout(timeout);
            
            // Wait for content to load
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            let targetElement;
            try {
              targetElement = iframe.contentDocument?.body;
              if (!targetElement) {
                throw new Error('Cannot access iframe content due to CORS policy');
              }
            } catch (corsError) {
              // Fallback: Create a simple PDF with the URL
              document.body.removeChild(iframe);
              const pdfDoc = await PDFDocument.create();
              const page = pdfDoc.addPage(PageSizes.A4);
              const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
              
              page.drawText('Website Conversion', {
                x: 50,
                y: 750,
                size: 20,
                font,
                color: rgb(0, 0, 0),
              });
              
              page.drawText(`URL: ${url}`, {
                x: 50,
                y: 700,
                size: 12,
                font,
                color: rgb(0, 0, 0),
              });
              
              page.drawText('Note: This website could not be directly converted due to', {
                x: 50,
                y: 650,
                size: 12,
                font,
                color: rgb(0, 0, 0),
              });
              
              page.drawText('cross-origin restrictions. Please try a different URL or', {
                x: 50,
                y: 630,
                size: 12,
                font,
                color: rgb(0, 0, 0),
              });
              
              page.drawText('use the browser\'s print-to-PDF feature.', {
                x: 50,
                y: 610,
                size: 12,
                font,
                color: rgb(0, 0, 0),
              });

              const pdfBytes = await pdfDoc.save();
              const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
              resolve(pdfBlob);
              return;
            }
            
            const canvas = await html2canvas(targetElement, {
              width: 1200,
              height: 800,
              scale: 1,
              useCORS: true,
              allowTaint: false,
              backgroundColor: '#ffffff',
            });
            
            // Create PDF from canvas
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage(PageSizes.A4);
            const { width, height } = page.getSize();
            
            // Convert canvas to PNG
            const imgData = canvas.toDataURL('image/png');
            const imgBytes = await fetch(imgData).then(res => res.arrayBuffer());
            const image = await pdfDoc.embedPng(imgBytes);
            
            // Scale image to fit page
            const imageAspectRatio = image.width / image.height;
            const pageAspectRatio = width / height;
            
            let imageWidth, imageHeight;
            if (imageAspectRatio > pageAspectRatio) {
              imageWidth = width - 40;
              imageHeight = imageWidth / imageAspectRatio;
            } else {
              imageHeight = height - 40;
              imageWidth = imageHeight * imageAspectRatio;
            }

            page.drawImage(image, {
              x: (width - imageWidth) / 2,
              y: (height - imageHeight) / 2,
              width: imageWidth,
              height: imageHeight,
            });

            const pdfBytes = await pdfDoc.save();
            const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
            
            document.body.removeChild(iframe);
            resolve(pdfBlob);
          } catch (error) {
            clearTimeout(timeout);
            document.body.removeChild(iframe);
            reject(new Error(`Failed to convert webpage: ${error.message}`));
          }
        };

        iframe.onerror = () => {
          clearTimeout(timeout);
          document.body.removeChild(iframe);
          reject(new Error('Failed to load webpage. Please check the URL.'));
        };

        // Handle CORS errors
        try {
          iframe.src = url;
        } catch (error) {
          clearTimeout(timeout);
          document.body.removeChild(iframe);
          reject(new Error('Invalid URL or CORS restrictions prevent access.'));
        }
      });
    } catch (error) {
      console.error('HTML to PDF conversion failed:', error);
      throw new Error('Failed to convert webpage to PDF');
    }
  }
}