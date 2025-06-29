import { PDFProcessor } from './pdfProcessor';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import PizZip from 'pizzip';

export class DocumentProcessor {
  // Convert Word to PDF
  static async wordToPdf(file: File): Promise<Blob> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const title = file.name.replace(/\.[^/.]+$/, '');
      return PDFProcessor.createTextPdf(result.value, title);
    } catch (error) {
      console.error('Word to PDF conversion failed:', error);
      throw new Error('Failed to convert Word document to PDF');
    }
  }

  // Convert Excel to PDF
  static async excelToPdf(file: File): Promise<Blob> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      let content = '';
      workbook.SheetNames.forEach((sheetName, index) => {
        const worksheet = workbook.Sheets[sheetName];
        const csvData = XLSX.utils.sheet_to_csv(worksheet);
        
        if (index > 0) content += '\n\n';
        content += `Sheet: ${sheetName}\n`;
        content += '='.repeat(50) + '\n';
        content += csvData.replace(/,/g, '\t'); // Replace commas with tabs for better formatting
      });

      const title = file.name.replace(/\.[^/.]+$/, '');
      return PDFProcessor.createTextPdf(content, title);
    } catch (error) {
      console.error('Excel to PDF conversion failed:', error);
      throw new Error('Failed to convert Excel document to PDF');
    }
  }

  // Convert PowerPoint to PDF (simplified)
  static async powerPointToPdf(file: File): Promise<Blob> {
    try {
      // PowerPoint conversion is complex, so we'll extract what we can
      const arrayBuffer = await file.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      
      let content = `PowerPoint Presentation: ${file.name}\n\n`;
      
      // Try to extract slide content (this is a simplified approach)
      try {
        const slideFiles = Object.keys(zip.files).filter(name => 
          name.includes('slide') && name.endsWith('.xml')
        );
        
        slideFiles.forEach((slideFile, index) => {
          content += `Slide ${index + 1}:\n`;
          content += '-'.repeat(20) + '\n';
          
          try {
            const slideContent = zip.files[slideFile].asText();
            // Extract text content (very basic XML parsing)
            const textMatches = slideContent.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
            if (textMatches) {
              textMatches.forEach(match => {
                const text = match.replace(/<[^>]*>/g, '').trim();
                if (text) content += text + '\n';
              });
            }
          } catch (e) {
            content += 'Unable to extract slide content\n';
          }
          
          content += '\n';
        });
      } catch (e) {
        content += 'This PowerPoint file contains slides that could not be processed.\n';
        content += 'The original presentation may contain images, animations, and complex formatting.\n';
      }

      const title = file.name.replace(/\.[^/.]+$/, '');
      return PDFProcessor.createTextPdf(content, title);
    } catch (error) {
      console.error('PowerPoint to PDF conversion failed:', error);
      throw new Error('Failed to convert PowerPoint document to PDF');
    }
  }

  // PDF to Word - Extract actual text and create proper Word document
  static async pdfToWord(file: File): Promise<Blob> {
    try {
      const extractedText = await PDFProcessor.extractTextFromPdf(file);
      
      // Create a proper Word document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Converted from: ${file.name}`,
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph({
              children: [new TextRun("")], // Empty paragraph for spacing
            }),
            ...extractedText.split('\n\n').map(paragraph => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: paragraph.trim(),
                    size: 24,
                  }),
                ],
              })
            ),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      return blob;
    } catch (error) {
      console.error('PDF to Word conversion failed:', error);
      throw new Error('Failed to convert PDF to Word document');
    }
  }

  // PDF to Excel - Extract text and organize into spreadsheet
  static async pdfToExcel(file: File): Promise<Blob> {
    try {
      const extractedText = await PDFProcessor.extractTextFromPdf(file);
      
      // Try to organize text into rows and columns
      const lines = extractedText.split('\n').filter(line => line.trim());
      const data: string[][] = [];
      
      // Add header
      data.push(['Source File', 'Page/Section', 'Content']);
      
      // Process lines and try to detect tabular data
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          // Check if line contains multiple tab-separated or space-separated values
          const parts = trimmedLine.split(/\s{2,}|\t/).filter(part => part.trim());
          
          if (parts.length > 1) {
            // Looks like tabular data
            data.push([file.name, `Line ${index + 1}`, ...parts]);
          } else {
            // Regular text
            data.push([file.name, `Line ${index + 1}`, trimmedLine]);
          }
        }
      });
      
      // Create workbook
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');
      
      // Auto-size columns
      const colWidths = data[0].map((_, colIndex) => {
        const maxLength = Math.max(
          ...data.map(row => (row[colIndex] || '').toString().length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      ws['!cols'] = colWidths;
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      return new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
    } catch (error) {
      console.error('PDF to Excel conversion failed:', error);
      throw new Error('Failed to convert PDF to Excel document');
    }
  }

  // PDF to PowerPoint - Extract text and create slides
  static async pdfToPowerPoint(file: File): Promise<Blob> {
    try {
      const extractedText = await PDFProcessor.extractTextFromPdf(file);
      
      // For now, create a simple text file that represents PowerPoint content
      // In a full implementation, you'd use a PowerPoint generation library
      const slides = extractedText.split('\n\n').filter(slide => slide.trim());
      
      let pptContent = `PowerPoint Presentation converted from: ${file.name}\n\n`;
      
      slides.forEach((slide, index) => {
        pptContent += `Slide ${index + 1}:\n`;
        pptContent += '='.repeat(40) + '\n';
        pptContent += slide.trim() + '\n\n';
      });
      
      pptContent += '\nNote: This is a text representation of the PowerPoint content.\n';
      pptContent += 'In a full implementation, this would be a proper .pptx file with formatted slides.';
      
      return new Blob([pptContent], { 
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
      });
    } catch (error) {
      console.error('PDF to PowerPoint conversion failed:', error);
      throw new Error('Failed to convert PDF to PowerPoint document');
    }
  }
}