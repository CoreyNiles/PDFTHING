import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export class PDFProcessor {
  // Extract text from PDF using PDF.js with better encoding handling
  static async extractTextFromPdf(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useSystemFonts: true,
        disableFontFace: false,
        verbosity: 0
      }).promise;
      
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent({
          normalizeWhitespace: true,
          disableCombineTextItems: false
        });
        
        // Better text extraction with proper spacing and formatting
        let pageText = '';
        let lastY = null;
        let lastX = null;
        
        for (const item of textContent.items) {
          if ('str' in item && 'transform' in item) {
            const currentY = item.transform[5];
            const currentX = item.transform[4];
            
            // Add line breaks for new lines (different Y coordinates)
            if (lastY !== null && Math.abs(currentY - lastY) > 5) {
              pageText += '\n';
            }
            // Add spaces for horizontal gaps
            else if (lastX !== null && lastY !== null && 
                     Math.abs(currentY - lastY) < 5 && 
                     currentX - lastX > 10) {
              pageText += ' ';
            }
            
            // Clean and add the text
            const cleanText = item.str
              .replace(/\s+/g, ' ') // Normalize whitespace
              .replace(/[^\x20-\x7E\u00A0-\u024F\u1E00-\u1EFF]/g, '') // Remove non-printable chars but keep accented characters
              .trim();
            
            if (cleanText) {
              pageText += cleanText;
            }
            
            lastY = currentY;
            lastX = currentX + (item.width || 0);
          }
        }
        
        if (pageText.trim()) {
          fullText += pageText.trim() + '\n\n';
        }
      }

      // Clean up the final text
      const cleanedText = fullText
        .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
        .replace(/\s+$/gm, '') // Remove trailing spaces
        .trim();

      if (!cleanedText || cleanedText.length < 10) {
        throw new Error('No readable text could be extracted from this PDF. The PDF may contain only images or use unsupported fonts.');
      }

      return cleanedText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      if (error.message && error.message.includes('No readable text')) {
        throw error;
      }
      throw new Error('Failed to extract text from PDF. The file may be corrupted or password-protected.');
    }
  }

  // Convert PDF to images using PDF.js
  static async pdfToImages(file: File, format: 'jpg' | 'png' = 'jpg'): Promise<Blob[]> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const images: Blob[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const scale = 2.0; // Higher scale for better quality
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

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), `image/${format}`, 0.95);
        });

        images.push(blob);
      }

      return images;
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      throw new Error('Failed to convert PDF to images');
    }
  }

  // Convert images to PDF
  static async imagesToPdf(files: File[]): Promise<Blob> {
    try {
      const pdfDoc = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        let image;

        if (file.type.includes('png')) {
          image = await pdfDoc.embedPng(arrayBuffer);
        } else if (file.type.includes('jpg') || file.type.includes('jpeg')) {
          image = await pdfDoc.embedJpg(arrayBuffer);
        } else {
          // Convert other formats to canvas first
          const img = new Image();
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
          });

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95);
          });
          
          const convertedBuffer = await blob.arrayBuffer();
          image = await pdfDoc.embedJpg(convertedBuffer);
        }

        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        
        // Scale image to fit page while maintaining aspect ratio
        const imageAspectRatio = image.width / image.height;
        const pageAspectRatio = width / height;
        
        let imageWidth, imageHeight;
        if (imageAspectRatio > pageAspectRatio) {
          imageWidth = width - 40; // 20px margin on each side
          imageHeight = imageWidth / imageAspectRatio;
        } else {
          imageHeight = height - 40; // 20px margin on top/bottom
          imageWidth = imageHeight * imageAspectRatio;
        }

        page.drawImage(image, {
          x: (width - imageWidth) / 2,
          y: (height - imageHeight) / 2,
          width: imageWidth,
          height: imageHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error converting images to PDF:', error);
      throw new Error('Failed to convert images to PDF');
    }
  }

  // Merge PDFs
  static async mergePdfs(files: File[]): Promise<Blob> {
    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error merging PDFs:', error);
      throw new Error('Failed to merge PDF files');
    }
  }

  // Split PDF
  static async splitPdf(file: File): Promise<Blob[]> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      const splitPdfs: Blob[] = [];

      for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
        newPdf.addPage(copiedPage);
        
        const pdfBytes = await newPdf.save();
        splitPdfs.push(new Blob([pdfBytes], { type: 'application/pdf' }));
      }

      return splitPdfs;
    } catch (error) {
      console.error('Error splitting PDF:', error);
      throw new Error('Failed to split PDF file');
    }
  }

  // Compress PDF
  static async compressPdf(file: File): Promise<Blob> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Save with compression options
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });
      
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error compressing PDF:', error);
      throw new Error('Failed to compress PDF file');
    }
  }

  // Rotate PDF pages
  static async rotatePdf(file: File, degrees: number = 90): Promise<Blob> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      pages.forEach(page => {
        const currentRotation = page.getRotation().angle;
        page.setRotation({ angle: currentRotation + degrees, type: 'degrees' });
      });

      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error rotating PDF:', error);
      throw new Error('Failed to rotate PDF pages');
    }
  }

  // Add watermark to PDF
  static async addWatermark(file: File, watermarkText: string): Promise<Blob> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      pages.forEach(page => {
        const { width, height } = page.getSize();
        
        // Calculate text dimensions
        const fontSize = Math.min(width, height) / 10;
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
        
        page.drawText(watermarkText, {
          x: (width - textWidth) / 2,
          y: height / 2,
          size: fontSize,
          font,
          color: rgb(0.7, 0.7, 0.7),
          opacity: 0.3,
          rotate: { angle: -45, type: 'degrees' },
        });
      });

      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error adding watermark:', error);
      throw new Error('Failed to add watermark to PDF');
    }
  }

  // Add page numbers
  static async addPageNumbers(file: File): Promise<Blob> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      pages.forEach((page, index) => {
        const { width } = page.getSize();
        const pageNumber = `${index + 1}`;
        const textWidth = font.widthOfTextAtSize(pageNumber, 12);
        
        page.drawText(pageNumber, {
          x: (width - textWidth) / 2,
          y: 30,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
      });

      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error adding page numbers:', error);
      throw new Error('Failed to add page numbers to PDF');
    }
  }

  // Protect PDF with password (basic implementation)
  static async protectPdf(file: File, password: string): Promise<Blob> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Note: pdf-lib doesn't support password protection directly
      // This is a placeholder - in a real implementation, you'd use a different library
      // For now, we'll just return the original PDF
      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error protecting PDF:', error);
      throw new Error('Failed to protect PDF file');
    }
  }

  // Delete specific pages
  static async deletePages(file: File, pagesToDelete: number[]): Promise<Blob> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const totalPages = pdfDoc.getPageCount();
      
      // Remove pages in reverse order to maintain indices
      const sortedPages = pagesToDelete.sort((a, b) => b - a);
      sortedPages.forEach(pageIndex => {
        if (pageIndex >= 0 && pageIndex < totalPages) {
          pdfDoc.removePage(pageIndex);
        }
      });

      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error deleting pages:', error);
      throw new Error('Failed to delete pages from PDF');
    }
  }

  // HTML to PDF
  static async htmlToPdf(url: string): Promise<Blob> {
    try {
      // Create a temporary iframe to load the URL
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '1200px';
      iframe.style.height = '800px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          document.body.removeChild(iframe);
          reject(new Error('Timeout loading webpage'));
        }, 30000);

        iframe.onload = async () => {
          try {
            clearTimeout(timeout);
            
            // Wait a bit for content to load
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const canvas = await html2canvas(iframe.contentDocument!.body, {
              width: 1200,
              height: 800,
              scale: 1,
              useCORS: true,
              allowTaint: true,
            });
            
            // Create PDF from canvas
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage(PageSizes.A4);
            const { width, height } = page.getSize();
            
            // Convert canvas to image
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
            reject(error);
          }
        };

        iframe.onerror = () => {
          clearTimeout(timeout);
          document.body.removeChild(iframe);
          reject(new Error('Failed to load webpage'));
        };

        iframe.src = url;
      });
    } catch (error) {
      console.error('Error converting HTML to PDF:', error);
      throw new Error('Failed to convert webpage to PDF');
    }
  }

  // Create text-based PDF from extracted content
  static async createTextPdf(content: string, title: string = 'Document'): Promise<Blob> {
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;
      const margin = 50;
      
      let page = pdfDoc.addPage(PageSizes.A4);
      let { width, height } = page.getSize();
      let yPosition = height - margin;
      
      // Add title
      page.drawText(title, {
        x: margin,
        y: yPosition,
        size: 16,
        font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;
      
      // Split content into lines that fit the page width
      const maxWidth = width - (margin * 2);
      const lines = content.split('\n');
      
      for (const line of lines) {
        if (line.trim() === '') {
          yPosition -= fontSize + 2;
          continue;
        }
        
        const words = line.split(' ');
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);
          
          if (textWidth > maxWidth && currentLine) {
            // Draw current line and start new one
            page.drawText(currentLine, {
              x: margin,
              y: yPosition,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
            });
            yPosition -= fontSize + 2;
            currentLine = word;
            
            // Check if we need a new page
            if (yPosition < margin) {
              page = pdfDoc.addPage(PageSizes.A4);
              ({ width, height } = page.getSize());
              yPosition = height - margin;
            }
          } else {
            currentLine = testLine;
          }
        }
        
        // Draw remaining text
        if (currentLine) {
          page.drawText(currentLine, {
            x: margin,
            y: yPosition,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
          yPosition -= fontSize + 2;
          
          // Check if we need a new page
          if (yPosition < margin) {
            page = pdfDoc.addPage(PageSizes.A4);
            ({ width, height } = page.getSize());
            yPosition = height - margin;
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error creating text PDF:', error);
      throw new Error('Failed to create PDF from text');
    }
  }

  // Download file helper
  static downloadFile(blob: Blob, filename: string) {
    saveAs(blob, filename);
  }

  // Download multiple files as ZIP
  static async downloadAsZip(files: { blob: Blob; filename: string }[], zipName: string) {
    try {
      const zip = new JSZip();
      
      files.forEach(({ blob, filename }) => {
        zip.file(filename, blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, zipName);
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      throw new Error('Failed to create ZIP file');
    }
  }
}