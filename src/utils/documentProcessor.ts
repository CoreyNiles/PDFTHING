import { PDFProcessor } from './pdfProcessor';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import PizZip from 'pizzip';

// A helper function to create a valid .docx file from text
async function createDocxFromText(text: string, sourceFilename: string): Promise<Blob> {
  const paragraphs = text.split('\n').map(p => 
    new Paragraph({
      children: [new TextRun(p)],
    })
  );

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: `Converted from: ${sourceFilename}`,
              bold: true,
              size: 28,
            }),
          ],
        }),
        new Paragraph({ children: [new TextRun("")] }), // Spacing
        ...paragraphs,
      ],
    }],
  });

  return await Packer.toBlob(doc);
}

export class DocumentProcessor {
  // Convert Word to PDF (Text-based)
  static async wordToPdf(file: File): Promise<Blob> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const title = file.name.replace(/\.[^/.]+$/, '');
      return PDFProcessor.createFormattedPdf(result.value, title);
    } catch (error) {
      console.error('Word to PDF conversion failed:', error);
      throw new Error('Failed to convert Word document. The file may be corrupted or in an unsupported format.');
    }
  }

  // Convert Excel to PDF (Text-based)
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
        content += csvData.replace(/,/g, '\t');
      });

      const title = file.name.replace(/\.[^/.]+$/, '');
      return PDFProcessor.createFormattedPdf(content, title);
    } catch (error) {
      console.error('Excel to PDF conversion failed:', error);
      throw new Error('Failed to convert Excel document. The file may be corrupted or in an unsupported format.');
    }
  }

  // Convert PowerPoint to PDF (Text-based)
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
      
      slideFiles.forEach((slideFile, index) => {
        content += `Slide ${index + 1}:\n`;
        content += '-'.repeat(20) + '\n';
        
        try {
          const slideContent = zip.files[slideFile].asText();
          
          // Extract text from XML
          const textPatterns = [
            /<a:t[^>]*>([^<]*)<\/a:t>/g,
            /<a:t>([^<]*)<\/a:t>/g,
            /<t[^>]*>([^<]*)<\/t>/g,
          ];
          
          const extractedTexts = new Set<string>();
          
          textPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(slideContent)) !== null) {
              const text = match[1]
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .trim();
              
              if (text && text.length > 0) {
                extractedTexts.add(text);
              }
            }
          });
          
          if (extractedTexts.size > 0) {
            Array.from(extractedTexts).forEach(text => {
              content += `• ${text}\n`;
            });
          } else {
            content += 'No readable text found on this slide.\n';
          }
        } catch (e) {
          content += 'Unable to extract slide content.\n';
        }
        
        content += '\n';
      });

      const title = file.name.replace(/\.[^/.]+$/, '');
      return PDFProcessor.createFormattedPdf(content, title);
    } catch (error) {
      console.error('PowerPoint to PDF conversion failed:', error);
      throw new Error('Failed to convert PowerPoint document. The file may be corrupted or in an unsupported format.');
    }
  }

  // Convert Text to PDF
  static async textToPdf(file: File): Promise<Blob> {
    try {
      const text = await file.text();
      const title = file.name.replace(/\.[^/.]+$/, '');
      return PDFProcessor.createFormattedPdf(text, title);
    } catch (error) {
      console.error('Text to PDF conversion failed:', error);
      throw new Error('Failed to convert text file. The file may be corrupted or in an unsupported format.');
    }
  }

  // PDF to Word - Extracts text and creates a REAL .docx file
  static async pdfToWord(file: File): Promise<Blob> {
    try {
      const extractedText = await PDFProcessor.extractTextFromPdf(file);
      return await createDocxFromText(extractedText, file.name);
    } catch (error) {
      console.error('PDF to Word conversion failed:', error);
      throw new Error('Failed to convert PDF to Word. The PDF may be an image or password-protected.');
    }
  }

  // PDF to Excel - Extracts text into a REAL .xlsx file
  static async pdfToExcel(file: File): Promise<Blob> {
    try {
      const extractedText = await PDFProcessor.extractTextFromPdf(file);
      const lines = extractedText.split('\n').filter(line => line.trim());
      const data: string[][] = [];
      
      // Add header
      data.push(['Source File', 'Line Number', 'Content']);
      
      lines.forEach((line, index) => {
        const parts = line.split(/\s{2,}|\t/); // Split by multiple spaces or tabs
        if (parts.length > 1) {
          // Looks like tabular data
          data.push([file.name, `Line ${index + 1}`, ...parts]);
        } else {
          // Regular text
          data.push([file.name, `Line ${index + 1}`, line.trim()]);
        }
      });
      
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
      throw new Error('Failed to convert PDF to Excel. The PDF may be an image or password-protected.');
    }
  }

  // PDF to PowerPoint - Creates a text file with extracted content
  static async pdfToPowerPoint(file: File): Promise<Blob> {
    try {
      const extractedText = await PDFProcessor.extractTextFromPdf(file);
      
      let pptContent = `Text content extracted from: ${file.name}\n\n`;
      pptContent += 'IMPORTANT: This is a plain text extraction, not a PowerPoint file.\n';
      pptContent += 'A full PowerPoint conversion requires specialized software.\n\n';
      pptContent += '====================================\n\n';
      
      // Split content into logical slides
      const sections = extractedText.split(/\n\s*\n/).filter(section => section.trim());
      
      sections.forEach((section, index) => {
        pptContent += `Suggested Slide ${index + 1}:\n`;
        pptContent += '-'.repeat(30) + '\n';
        pptContent += section.trim() + '\n\n';
      });
      
      pptContent += '\n====================================\n';
      pptContent += 'To create a real PowerPoint file:\n';
      pptContent += '1. Copy this text content\n';
      pptContent += '2. Open PowerPoint\n';
      pptContent += '3. Paste and format as needed\n';
      
      return new Blob([pptContent], { 
        type: 'text/plain;charset=utf-8' 
      });
    } catch (error) {
      console.error('PDF to PowerPoint extraction failed:', error);
      throw new Error('Failed to extract text for PowerPoint. The PDF may be an image or password-protected.');
    }
  }

  // PDF to Text - Simple text extraction
  static async pdfToText(file: File): Promise<Blob> {
    try {
      const extractedText = await PDFProcessor.extractTextFromPdf(file);
      return new Blob([extractedText], { 
        type: 'text/plain;charset=utf-8' 
      });
    } catch (error) {
      console.error('PDF to Text conversion failed:', error);
      throw new Error('Failed to extract text from PDF. The PDF may be an image or password-protected.');
    }
  }
}