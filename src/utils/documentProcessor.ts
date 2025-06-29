import { PDFProcessor } from './pdfProcessor';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import PizZip from 'pizzip';

export class DocumentProcessor {
  // Convert Word to PDF - Extract text and create formatted PDF
  static async wordToPdf(file: File): Promise<Blob> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Use mammoth to extract rich text with basic formatting
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const htmlContent = result.value;
      
      // Extract plain text as fallback
      const textResult = await mammoth.extractRawText({ arrayBuffer });
      const plainText = textResult.value;
      
      const title = file.name.replace(/\.[^/.]+$/, '');
      
      // Create a more structured PDF from the content
      return PDFProcessor.createFormattedPdf(plainText, title, {
        includeFormatting: true,
        fontSize: 11,
        lineSpacing: 1.2
      });
    } catch (error) {
      console.error('Word to PDF conversion failed:', error);
      throw new Error('Failed to convert Word document to PDF. The file may be corrupted or use an unsupported format.');
    }
  }

  // Convert Excel to PDF - Create properly formatted table-like PDF
  static async excelToPdf(file: File): Promise<Blob> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      let content = `Excel Spreadsheet: ${file.name}\n\n`;
      
      workbook.SheetNames.forEach((sheetName, sheetIndex) => {
        const worksheet = workbook.Sheets[sheetName];
        
        if (sheetIndex > 0) content += '\n\n';
        content += `Sheet: ${sheetName}\n`;
        content += '='.repeat(60) + '\n\n';
        
        // Convert to array of arrays for better formatting
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          content += 'No data in this sheet.\n';
          return;
        }
        
        // Format as table
        jsonData.forEach((row: any[], rowIndex) => {
          if (Array.isArray(row) && row.length > 0) {
            const formattedRow = row.map(cell => 
              cell !== null && cell !== undefined ? String(cell).padEnd(15) : ''.padEnd(15)
            ).join(' | ');
            content += formattedRow + '\n';
            
            // Add separator after header row
            if (rowIndex === 0) {
              content += '-'.repeat(formattedRow.length) + '\n';
            }
          }
        });
      });

      const title = file.name.replace(/\.[^/.]+$/, '');
      return PDFProcessor.createFormattedPdf(content, title, {
        fontSize: 10,
        fontFamily: 'monospace',
        preserveSpacing: true
      });
    } catch (error) {
      console.error('Excel to PDF conversion failed:', error);
      throw new Error('Failed to convert Excel document to PDF. The file may be corrupted or password-protected.');
    }
  }

  // Convert PowerPoint to PDF - Improved XML parsing
  static async powerPointToPdf(file: File): Promise<Blob> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      
      let content = `PowerPoint Presentation: ${file.name}\n\n`;
      
      // Get slide files in order
      const slideFiles = Object.keys(zip.files)
        .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
        .sort((a, b) => {
          const aNum = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0');
          const bNum = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0');
          return aNum - bNum;
        });
      
      if (slideFiles.length === 0) {
        content += 'No slides found in this presentation.\n';
        content += 'This may be an older PowerPoint format or the file may be corrupted.\n';
      } else {
        slideFiles.forEach((slideFile, index) => {
          content += `Slide ${index + 1}:\n`;
          content += '='.repeat(40) + '\n';
          
          try {
            const slideContent = zip.files[slideFile].asText();
            
            // More robust text extraction using multiple patterns
            const textPatterns = [
              /<a:t[^>]*>([^<]*)<\/a:t>/g,
              /<t[^>]*>([^<]*)<\/t>/g,
              /<text[^>]*>([^<]*)<\/text>/g
            ];
            
            let extractedTexts: string[] = [];
            
            textPatterns.forEach(pattern => {
              let match;
              while ((match = pattern.exec(slideContent)) !== null) {
                const text = match[1].trim();
                if (text && !extractedTexts.includes(text)) {
                  extractedTexts.push(text);
                }
              }
            });
            
            if (extractedTexts.length > 0) {
              extractedTexts.forEach(text => {
                content += `• ${text}\n`;
              });
            } else {
              content += 'No readable text found on this slide.\n';
              content += '(May contain images, charts, or complex formatting)\n';
            }
          } catch (e) {
            content += 'Unable to extract content from this slide.\n';
          }
          
          content += '\n';
        });
      }
      
      content += '\n' + '='.repeat(60) + '\n';
      content += 'Note: This conversion extracts text content only.\n';
      content += 'Images, animations, and complex formatting are not preserved.\n';
      content += 'For full fidelity, use PowerPoint\'s built-in "Export as PDF" feature.\n';

      const title = file.name.replace(/\.[^/.]+$/, '');
      return PDFProcessor.createFormattedPdf(content, title, {
        fontSize: 11,
        includeFormatting: true
      });
    } catch (error) {
      console.error('PowerPoint to PDF conversion failed:', error);
      throw new Error('Failed to convert PowerPoint document to PDF. The file may be corrupted, password-protected, or in an unsupported format.');
    }
  }

  // PDF to Word - Create proper Word document with better formatting
  static async pdfToWord(file: File): Promise<Blob> {
    try {
      const extractedText = await PDFProcessor.extractTextFromPdf(file);
      
      if (!extractedText || extractedText.trim().length < 10) {
        throw new Error('No readable text found in PDF. This may be a scanned document that requires OCR processing.');
      }
      
      // Split text into paragraphs and detect headings
      const lines = extractedText.split('\n').filter(line => line.trim());
      const paragraphs: any[] = [];
      
      // Add document header
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Converted from: ${file.name}`,
              bold: true,
              size: 28,
              color: '2563eb'
            }),
          ],
          spacing: { after: 400 }
        })
      );
      
      // Process content
      let currentParagraph = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (!trimmedLine) {
          if (currentParagraph) {
            paragraphs.push(this.createWordParagraph(currentParagraph));
            currentParagraph = '';
          }
          continue;
        }
        
        // Detect potential headings (short lines, all caps, or ending with colon)
        const isHeading = trimmedLine.length < 60 && 
          (trimmedLine === trimmedLine.toUpperCase() || 
           trimmedLine.endsWith(':') ||
           /^[A-Z][A-Z\s]+$/.test(trimmedLine));
        
        if (isHeading && currentParagraph) {
          paragraphs.push(this.createWordParagraph(currentParagraph));
          currentParagraph = '';
          
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: trimmedLine,
                  bold: true,
                  size: 26,
                }),
              ],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 200 }
            })
          );
        } else {
          currentParagraph += (currentParagraph ? ' ' : '') + trimmedLine;
          
          // Break long paragraphs
          if (currentParagraph.length > 500) {
            paragraphs.push(this.createWordParagraph(currentParagraph));
            currentParagraph = '';
          }
        }
      }
      
      // Add remaining content
      if (currentParagraph) {
        paragraphs.push(this.createWordParagraph(currentParagraph));
      }
      
      // Add footer note
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '\n\nNote: This document was converted from PDF. Original formatting may not be preserved.',
              italics: true,
              size: 20,
              color: '6b7280'
            }),
          ],
          spacing: { before: 400 }
        })
      );

      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
      });

      const blob = await Packer.toBlob(doc);
      return blob;
    } catch (error) {
      console.error('PDF to Word conversion failed:', error);
      if (error.message && error.message.includes('No readable text')) {
        throw error;
      }
      throw new Error('Failed to convert PDF to Word document. The PDF may be corrupted, password-protected, or contain only images.');
    }
  }

  // Helper method to create Word paragraphs
  private static createWordParagraph(text: string) {
    return new Paragraph({
      children: [
        new TextRun({
          text: text.trim(),
          size: 24,
        }),
      ],
      spacing: { after: 200 }
    });
  }

  // PDF to Excel - Create structured spreadsheet
  static async pdfToExcel(file: File): Promise<Blob> {
    try {
      const extractedText = await PDFProcessor.extractTextFromPdf(file);
      
      if (!extractedText || extractedText.trim().length < 10) {
        throw new Error('No readable text found in PDF. This may be a scanned document that requires OCR processing.');
      }
      
      const lines = extractedText.split('\n').filter(line => line.trim());
      const data: string[][] = [];
      
      // Add header with metadata
      data.push(['PDF Conversion Report']);
      data.push(['Source File:', file.name]);
      data.push(['Conversion Date:', new Date().toLocaleDateString()]);
      data.push(['Total Lines Extracted:', lines.length.toString()]);
      data.push([]); // Empty row
      
      // Add column headers
      data.push(['Line #', 'Content Type', 'Text Content', 'Character Count']);
      
      // Process each line
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          // Detect content type
          let contentType = 'Text';
          if (/^\d+\.?\s/.test(trimmedLine)) contentType = 'Numbered Item';
          else if (/^[•\-\*]\s/.test(trimmedLine)) contentType = 'Bullet Point';
          else if (trimmedLine.length < 60 && trimmedLine === trimmedLine.toUpperCase()) contentType = 'Heading';
          else if (/\d{2,}/.test(trimmedLine) && trimmedLine.length < 100) contentType = 'Data/Numbers';
          else if (/@/.test(trimmedLine)) contentType = 'Email/Contact';
          else if (/https?:\/\//.test(trimmedLine)) contentType = 'URL';
          
          // Split long content into multiple cells if it contains separators
          const parts = trimmedLine.split(/\s{3,}|\t/).filter(part => part.trim());
          
          if (parts.length > 1) {
            // Looks like tabular data
            data.push([
              (index + 1).toString(),
              'Tabular Data',
              ...parts.slice(0, 5) // Limit to 5 columns
            ]);
          } else {
            data.push([
              (index + 1).toString(),
              contentType,
              trimmedLine,
              trimmedLine.length.toString()
            ]);
          }
        }
      });
      
      // Create workbook
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'PDF Content');
      
      // Auto-size columns
      const colWidths = data[0].map((_, colIndex) => {
        const maxLength = Math.max(
          ...data.map(row => (row[colIndex] || '').toString().length)
        );
        return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
      });
      ws['!cols'] = colWidths;
      
      // Add some styling to headers
      const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 5, c: col }); // Header row
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'E3F2FD' } }
          };
        }
      }
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      return new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
    } catch (error) {
      console.error('PDF to Excel conversion failed:', error);
      if (error.message && error.message.includes('No readable text')) {
        throw error;
      }
      throw new Error('Failed to convert PDF to Excel document. The PDF may be corrupted, password-protected, or contain only images.');
    }
  }

  // PDF to PowerPoint - Create structured presentation
  static async pdfToPowerPoint(file: File): Promise<Blob> {
    try {
      const extractedText = await PDFProcessor.extractTextFromPdf(file);
      
      if (!extractedText || extractedText.trim().length < 10) {
        throw new Error('No readable text found in PDF. This may be a scanned document that requires OCR processing.');
      }
      
      // Split content into logical slides
      const sections = extractedText.split(/\n\s*\n/).filter(section => section.trim());
      
      let pptContent = `PowerPoint Presentation converted from: ${file.name}\n\n`;
      pptContent += `Conversion Date: ${new Date().toLocaleDateString()}\n`;
      pptContent += `Total Sections: ${sections.length}\n\n`;
      pptContent += '='.repeat(60) + '\n\n';
      
      sections.forEach((section, index) => {
        const lines = section.trim().split('\n').filter(line => line.trim());
        
        pptContent += `Slide ${index + 1}:\n`;
        pptContent += '='.repeat(40) + '\n';
        
        if (lines.length > 0) {
          // First line as title
          pptContent += `Title: ${lines[0].trim()}\n\n`;
          
          // Remaining lines as content
          if (lines.length > 1) {
            pptContent += 'Content:\n';
            lines.slice(1).forEach(line => {
              const trimmedLine = line.trim();
              if (trimmedLine) {
                pptContent += `• ${trimmedLine}\n`;
              }
            });
          }
        } else {
          pptContent += 'No content extracted for this slide.\n';
        }
        
        pptContent += '\n';
      });
      
      pptContent += '='.repeat(60) + '\n';
      pptContent += 'CONVERSION NOTES:\n';
      pptContent += '• This is a text representation of PowerPoint content\n';
      pptContent += '• Original formatting, images, and animations are not preserved\n';
      pptContent += '• For full fidelity conversion, use specialized PowerPoint tools\n';
      pptContent += '• Each section above represents a suggested slide layout\n';
      
      return new Blob([pptContent], { 
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
      });
    } catch (error) {
      console.error('PDF to PowerPoint conversion failed:', error);
      if (error.message && error.message.includes('No readable text')) {
        throw error;
      }
      throw new Error('Failed to convert PDF to PowerPoint document. The PDF may be corrupted, password-protected, or contain only images.');
    }
  }
}