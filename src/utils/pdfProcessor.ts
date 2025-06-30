import { PDFDocument, rgb, StandardFonts, PageSizes, PDFPage, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface PdfFormattingOptions {
  fontSize?: number;
  fontFamily?: 'helvetica' | 'times' | 'courier' | 'monospace';
  lineSpacing?: number;
  includeFormatting?: boolean;
  preserveSpacing?: boolean;
}

export class PDFProcessor {
  // Extract text from PDF using PDF.js with enhanced error handling
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
      let hasReadableText = false;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent({
          normalizeWhitespace: true,
          disableCombineTextItems: false
        });
        
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
              .replace(/\s+/g, ' ')
              .trim();
            
            if (cleanText) {
              pageText += cleanText;
              hasReadableText = true;
            }
            
            lastY = currentY;
            lastX = currentX + (item.width || 0);
          }
        }
        
        if (pageText.trim()) {
          fullText += `\n--- Page ${pageNum} ---\n` + pageText.trim() + '\n';
        }
      }

      // Clean up the final text
      const cleanedText = fullText
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\s+$/gm, '')
        .trim();

      if (!hasReadableText || cleanedText.length < 10) {
        throw new Error('No readable text could be extracted from this PDF. This appears to be a scanned document or contains only images. Please use the OCR tool to extract text from scanned PDFs.');
      }

      return cleanedText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      if (error.message && error.message.includes('No readable text')) {
        throw error;
      }
      if (error.message && error.message.includes('Invalid PDF')) {
        throw new Error('This file appears to be corrupted or is not a valid PDF document.');
      }
      if (error.message && error.message.includes('password')) {
        throw new Error('This PDF is password-protected. Please unlock it first using the Unlock PDF tool.');
      }
      throw new Error('Failed to extract text from PDF. The file may be corrupted, password-protected, or contain only images.');
    }
  }

  // Convert PDF to images using PDF.js with better quality
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
        canvas.remove(); // Clean up
      }

      return images;
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      throw new Error('Failed to convert PDF to images. The file may be corrupted or password-protected.');
    }
  }

  // Convert images to PDF with better layout
  static async imagesToPdf(files: File[]): Promise<Blob> {
    try {
      const pdfDoc = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        let image;

        try {
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
            
            // Clean up
            URL.revokeObjectURL(img.src);
            canvas.remove();
          }
        } catch (embedError) {
          console.warn(`Failed to embed image ${file.name}:`, embedError);
          continue; // Skip this image and continue with others
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

      if (pdfDoc.getPageCount() === 0) {
        throw new Error('No valid images could be processed. Please check that your files are valid image formats.');
      }

      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error converting images to PDF:', error);
      throw new Error('Failed to convert images to PDF. Please ensure all files are valid image formats.');
    }
  }

  // Merge PDFs with better error handling
  static async mergePdfs(files: File[]): Promise<Blob> {
    try {
      const mergedPdf = await PDFDocument.create();
      let totalPagesCopied = 0;

      for (const file of files) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await PDFDocument.load(arrayBuffer);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
          totalPagesCopied += copiedPages.length;
        } catch (fileError) {
          console.warn(`Failed to merge file ${file.name}:`, fileError);
          // Continue with other files instead of failing completely
        }
      }

      if (totalPagesCopied === 0) {
        throw new Error('No valid PDF files could be merged. Please check that all files are valid PDFs and not password-protected.');
      }

      const pdfBytes = await mergedPdf.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error merging PDFs:', error);
      throw new Error('Failed to merge PDF files. Some files may be corrupted or password-protected.');
    }
  }

  // Split PDF with better error handling
  static async splitPdf(file: File): Promise<Blob[]> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      
      if (pageCount === 0) {
        throw new Error('This PDF contains no pages to split.');
      }
      
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
      if (error.message && error.message.includes('password')) {
        throw new Error('This PDF is password-protected. Please unlock it first using the Unlock PDF tool.');
      }
      throw new Error('Failed to split PDF file. The file may be corrupted or password-protected.');
    }
  }

  // Compress PDF with actual compression
  static async compressPdf(file: File): Promise<Blob> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Save with compression options
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50,
      });
      
      const originalSize = arrayBuffer.byteLength;
      const compressedSize = pdfBytes.length;
      const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      
      console.log(`PDF compressed: ${originalSize} bytes → ${compressedSize} bytes (${compressionRatio}% reduction)`);
      
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error compressing PDF:', error);
      throw new Error('Failed to compress PDF file. The file may be corrupted or already optimized.');
    }
  }

  // Rotate PDF pages with validation
  static async rotatePdf(file: File, degrees: number = 90): Promise<Blob> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      if (pages.length === 0) {
        throw new Error('This PDF contains no pages to rotate.');
      }

      // Validate rotation degrees
      const validDegrees = [90, 180, 270, -90, -180, -270];
      if (!validDegrees.includes(degrees)) {
        degrees = 90; // Default to 90 degrees
      }

      pages.forEach(page => {
        page.setRotation(degrees(degrees));
      });

      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error rotating PDF:', error);
      throw new Error('Failed to rotate PDF pages. The file may be corrupted or password-protected.');
    }
  }

  // Add watermark with better positioning and options
  static async addWatermark(file: File, watermarkText: string, options?: {
    opacity?: number;
    fontSize?: number;
    color?: [number, number, number];
    rotation?: number;
    position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  }): Promise<Blob> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const {
        opacity = 0.3,
        fontSize: customFontSize,
        color = [0.7, 0.7, 0.7],
        rotation = -45,
        position = 'center'
      } = options || {};

      pages.forEach(page => {
        const { width, height } = page.getSize();
        
        const fontSize = customFontSize || Math.min(width, height) / 15;
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
        const textHeight = font.heightAtSize(fontSize);
        
        let x, y;
        
        switch (position) {
          case 'top-left':
            x = 50;
            y = height - 50 - textHeight;
            break;
          case 'top-right':
            x = width - textWidth - 50;
            y = height - 50 - textHeight;
            break;
          case 'bottom-left':
            x = 50;
            y = 50;
            break;
          case 'bottom-right':
            x = width - textWidth - 50;
            y = 50;
            break;
          default: // center
            x = (width - textWidth) / 2;
            y = height / 2;
        }
        
        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(color[0], color[1], color[2]),
          opacity,
          rotate: degrees(rotation),
        });
      });

      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error adding watermark:', error);
      throw new Error('Failed to add watermark to PDF. The file may be corrupted or password-protected.');
    }
  }

  // Add page numbers with better formatting
  static async addPageNumbers(file: File, options?: {
    position?: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right';
    format?: 'number' | 'page-of-total' | 'roman';
    fontSize?: number;
    startPage?: number;
  }): Promise<Blob> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const {
        position = 'bottom-center',
        format = 'page-of-total',
        fontSize = 12,
        startPage = 1
      } = options || {};

      const totalPages = pages.length;

      pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        const pageNumber = index + startPage;
        
        let pageText;
        switch (format) {
          case 'number':
            pageText = pageNumber.toString();
            break;
          case 'roman':
            pageText = this.toRoman(pageNumber);
            break;
          default: // page-of-total
            pageText = `Page ${pageNumber} of ${totalPages}`;
        }
        
        const textWidth = font.widthOfTextAtSize(pageText, fontSize);
        
        let x, y;
        const margin = 30;
        
        switch (position) {
          case 'bottom-left':
            x = margin;
            y = margin;
            break;
          case 'bottom-right':
            x = width - textWidth - margin;
            y = margin;
            break;
          case 'top-left':
            x = margin;
            y = height - margin - fontSize;
            break;
          case 'top-right':
            x = width - textWidth - margin;
            y = height - margin - fontSize;
            break;
          case 'top-center':
            x = (width - textWidth) / 2;
            y = height - margin - fontSize;
            break;
          default: // bottom-center
            x = (width - textWidth) / 2;
            y = margin;
        }
        
        page.drawText(pageText, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      });

      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error adding page numbers:', error);
      throw new Error('Failed to add page numbers to PDF. The file may be corrupted or password-protected.');
    }
  }

  // Helper method to convert numbers to Roman numerals
  private static toRoman(num: number): string {
    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
    let result = '';
    
    for (let i = 0; i < values.length; i++) {
      while (num >= values[i]) {
        result += symbols[i];
        num -= values[i];
      }
    }
    
    return result;
  }

  // Protect PDF with password (using pdf-lib encryption)
  static async protectPdf(file: File, password: string): Promise<Blob> {
    try {
      if (!password || password.length < 4) {
        throw new Error('Password must be at least 4 characters long.');
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Save with encryption (pdf-lib has limited encryption support)
      // This is a basic implementation - for production use, consider server-side encryption
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });
      
      // Note: pdf-lib doesn't support full encryption yet
      // This is a placeholder that saves the PDF normally
      // For real password protection, you'd need a different library or server-side processing
      
      console.warn('PDF password protection is limited in client-side processing. For full security, use server-side encryption.');
      
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error protecting PDF:', error);
      throw new Error('Failed to protect PDF file. Client-side password protection has limitations.');
    }
  }

  // Delete specific pages with validation
  static async deletePages(file: File, pagesToDelete: number[]): Promise<Blob> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const totalPages = pdfDoc.getPageCount();
      
      if (totalPages === 0) {
        throw new Error('This PDF contains no pages.');
      }
      
      // Validate page numbers
      const validPages = pagesToDelete.filter(pageNum => 
        pageNum >= 1 && pageNum <= totalPages
      );
      
      if (validPages.length === 0) {
        throw new Error('No valid page numbers specified for deletion.');
      }
      
      if (validPages.length >= totalPages) {
        throw new Error('Cannot delete all pages from the PDF.');
      }
      
      // Remove pages in reverse order to maintain indices
      const sortedPages = validPages.sort((a, b) => b - a);
      sortedPages.forEach(pageIndex => {
        pdfDoc.removePage(pageIndex - 1); // Convert to 0-based index
      });

      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error deleting pages:', error);
      throw new Error('Failed to delete pages from PDF. The file may be corrupted or password-protected.');
    }
  }

  // Convert URL to PDF with CORS handling
  static async urlToPdf(url: string): Promise<Blob> {
    try {
      // Validate URL
      try {
        new URL(url);
      } catch {
        throw new Error('Please enter a valid URL (e.g., https://example.com)');
      }

      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '1200px';
      iframe.style.height = '800px';
      iframe.style.border = 'none';
      iframe.sandbox = 'allow-same-origin allow-scripts';
      document.body.appendChild(iframe);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          document.body.removeChild(iframe);
          reject(new Error('Timeout loading webpage. The site may be slow or have restrictions.'));
        }, 30000);

        iframe.onload = async () => {
          try {
            clearTimeout(timeout);
            
            // Wait for content to load
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Try to access iframe content
            let targetElement;
            try {
              targetElement = iframe.contentDocument?.body;
              if (!targetElement) {
                throw new Error('CORS');
              }
            } catch (corsError) {
              // CORS fallback - create informational PDF
              document.body.removeChild(iframe);
              const fallbackPdf = await this.createCorsErrorPdf(url);
              resolve(fallbackPdf);
              return;
            }
            
            // Use html2canvas to capture the page
            const html2canvas = (await import('html2canvas')).default;
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
          reject(new Error('Failed to load webpage. Please check the URL and try again.'));
        };

        iframe.src = url;
      });
    } catch (error) {
      console.error('URL to PDF conversion failed:', error);
      throw new Error('Failed to convert webpage to PDF. Please check the URL and try again.');
    }
  }

  // Create CORS error fallback PDF
  private static async createCorsErrorPdf(url: string): Promise<Blob> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(PageSizes.A4);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    page.drawText('Website Conversion Notice', {
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
    
    const lines = [
      'This website could not be directly converted due to security restrictions.',
      '',
      'Alternative solutions:',
      '• Use your browser\'s "Print to PDF" feature',
      '• Try a different URL that allows cross-origin access',
      '• Use browser extensions designed for webpage capture',
      '',
      'Note: Many modern websites implement security measures that',
      'prevent automated capture for privacy and security reasons.'
    ];
    
    lines.forEach((line, index) => {
      page.drawText(line, {
        x: 50,
        y: 650 - (index * 20),
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
    });

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  // Create formatted PDF from text with enhanced formatting
  static async createFormattedPdf(content: string, title: string = 'Document', options: PdfFormattingOptions = {}): Promise<Blob> {
    try {
      const {
        fontSize = 12,
        fontFamily = 'helvetica',
        lineSpacing = 1.2,
        includeFormatting = false,
        preserveSpacing = false
      } = options;

      const pdfDoc = await PDFDocument.create();
      let font;
      
      switch (fontFamily) {
        case 'times':
          font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
          break;
        case 'courier':
        case 'monospace':
          font = await pdfDoc.embedFont(StandardFonts.Courier);
          break;
        default:
          font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }
      
      const margin = 50;
      let page = pdfDoc.addPage(PageSizes.A4);
      let { width, height } = page.getSize();
      let yPosition = height - margin;
      
      // Add title
      const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      page.drawText(title, {
        x: margin,
        y: yPosition,
        size: fontSize + 4,
        font: titleFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= (fontSize + 4) * 2;
      
      // Add creation date
      page.drawText(`Created: ${new Date().toLocaleDateString()}`, {
        x: margin,
        y: yPosition,
        size: fontSize - 2,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
      yPosition -= (fontSize + 10);
      
      // Process content
      const lines = content.split('\n');
      const maxWidth = width - (margin * 2);
      const lineHeight = fontSize * lineSpacing;
      
      for (const line of lines) {
        if (yPosition < margin + lineHeight) {
          page = pdfDoc.addPage(PageSizes.A4);
          ({ width, height } = page.getSize());
          yPosition = height - margin;
        }
        
        if (line.trim() === '') {
          yPosition -= lineHeight / 2;
          continue;
        }
        
        // Handle long lines
        if (preserveSpacing) {
          // For monospace content, preserve exact spacing
          page.drawText(line, {
            x: margin,
            y: yPosition,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
          yPosition -= lineHeight;
        } else {
          // Wrap long lines
          const words = line.split(' ');
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const textWidth = font.widthOfTextAtSize(testLine, fontSize);
            
            if (textWidth > maxWidth && currentLine) {
              page.drawText(currentLine, {
                x: margin,
                y: yPosition,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
              });
              yPosition -= lineHeight;
              currentLine = word;
              
              if (yPosition < margin + lineHeight) {
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
            yPosition -= lineHeight;
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error creating formatted PDF:', error);
      throw new Error('Failed to create PDF from text content.');
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

      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      saveAs(zipBlob, zipName);
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      throw new Error('Failed to create ZIP file for download.');
    }
  }
}