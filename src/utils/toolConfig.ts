import { FileText, Image, FileSpreadsheet, Presentation, Upload, Merge, Split, RefreshCw, RotateCcw, Compass as Compress, Scissors, Edit3, Eye, Search, Lock, Unlock, Shield, FileSignature as Signature, Type, Globe } from 'lucide-react';

export interface ToolConfig {
  title: string;
  description: string;
  icon: any;
  acceptedFormats: string[];
  outputFormat?: string;
  maxFiles: number;
  actionText?: string;
}

const toolConfigs: Record<string, Record<string, ToolConfig>> = {
  convert: {
    // PDF to other formats
    'pdf-to-word': {
      title: 'PDF to Word',
      description: 'Convert PDF documents to editable Word files',
      icon: FileText,
      acceptedFormats: ['.pdf'],
      outputFormat: 'docx',
      maxFiles: 10,
    },
    'pdf-to-excel': {
      title: 'PDF to Excel',
      description: 'Extract data from PDF files into Excel spreadsheets',
      icon: FileSpreadsheet,
      acceptedFormats: ['.pdf'],
      outputFormat: 'xlsx',
      maxFiles: 10,
    },
    'pdf-to-powerpoint': {
      title: 'PDF to PowerPoint',
      description: 'Convert PDF presentations to PowerPoint format',
      icon: Presentation,
      acceptedFormats: ['.pdf'],
      outputFormat: 'txt',
      maxFiles: 5,
    },
    'pdf-to-txt': {
      title: 'PDF to Text',
      description: 'Extract plain text content from PDF documents',
      icon: Type,
      acceptedFormats: ['.pdf'],
      outputFormat: 'txt',
      maxFiles: 20,
    },
    'pdf-to-jpg': {
      title: 'PDF to JPG',
      description: 'Convert PDF pages to high-quality JPG images',
      icon: Image,
      acceptedFormats: ['.pdf'],
      outputFormat: 'jpg',
      maxFiles: 20,
    },
    
    // Other formats to PDF
    'word-to-pdf': {
      title: 'Word to PDF',
      description: 'Convert Word documents to PDF files',
      icon: Upload,
      acceptedFormats: ['.doc', '.docx'],
      outputFormat: 'pdf',
      maxFiles: 10,
    },
    'excel-to-pdf': {
      title: 'Excel to PDF',
      description: 'Convert Excel spreadsheets to PDF',
      icon: Upload,
      acceptedFormats: ['.xls', '.xlsx'],
      outputFormat: 'pdf',
      maxFiles: 10,
    },
    'powerpoint-to-pdf': {
      title: 'PowerPoint to PDF',
      description: 'Convert PowerPoint presentations to PDF',
      icon: Upload,
      acceptedFormats: ['.ppt', '.pptx'],
      outputFormat: 'pdf',
      maxFiles: 10,
    },
    'txt-to-pdf': {
      title: 'Text to PDF',
      description: 'Convert plain text files to formatted PDF documents',
      icon: Upload,
      acceptedFormats: ['.txt'],
      outputFormat: 'pdf',
      maxFiles: 20,
    },
    'jpg-to-pdf': {
      title: 'Images to PDF',
      description: 'Convert images to PDF documents',
      icon: Upload,
      acceptedFormats: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'],
      outputFormat: 'pdf',
      maxFiles: 50,
    },
    'url-to-pdf': {
      title: 'URL to PDF',
      description: 'Convert web pages to PDF documents',
      icon: Globe,
      acceptedFormats: [],
      outputFormat: 'pdf',
      maxFiles: 1,
    },
  },
  organize: {
    'merge-pdf': {
      title: 'Merge PDF',
      description: 'Combine multiple PDF files into a single document',
      icon: Merge,
      acceptedFormats: ['.pdf'],
      maxFiles: 20,
      actionText: 'Merge PDFs',
    },
    'split-pdf': {
      title: 'Split PDF',
      description: 'Separate PDF pages into individual files',
      icon: Split,
      acceptedFormats: ['.pdf'],
      maxFiles: 1,
      actionText: 'Split PDF',
    },
    'rotate-pdf': {
      title: 'Rotate PDF',
      description: 'Change the orientation of PDF pages',
      icon: RotateCcw,
      acceptedFormats: ['.pdf'],
      maxFiles: 10,
      actionText: 'Rotate Pages',
    },
    'compress-pdf': {
      title: 'Compress PDF',
      description: 'Reduce PDF file size while maintaining quality',
      icon: Compress,
      acceptedFormats: ['.pdf'],
      maxFiles: 20,
      actionText: 'Compress Files',
    },
    'delete-pages': {
      title: 'Delete PDF Pages',
      description: 'Remove specific pages from your PDF documents',
      icon: Scissors,
      acceptedFormats: ['.pdf'],
      maxFiles: 10,
      actionText: 'Delete Pages',
    },
  },
  edit: {
    'edit-pdf': {
      title: 'Edit PDF',
      description: 'Add text, images, and shapes to your PDF',
      icon: Edit3,
      acceptedFormats: ['.pdf'],
      maxFiles: 5,
      actionText: 'Open Editor',
    },
    'add-watermark': {
      title: 'Add Watermark',
      description: 'Add text watermarks to your PDF pages',
      icon: Image,
      acceptedFormats: ['.pdf'],
      maxFiles: 20,
      actionText: 'Add Watermark',
    },
    'number-pages': {
      title: 'Number Pages',
      description: 'Automatically add page numbers to your PDF',
      icon: FileText,
      acceptedFormats: ['.pdf'],
      maxFiles: 20,
      actionText: 'Number Pages',
    },
    'ocr-pdf': {
      title: 'OCR PDF',
      description: 'Convert scanned PDFs to searchable text documents',
      icon: Search,
      acceptedFormats: ['.pdf'],
      maxFiles: 10,
      actionText: 'Extract Text',
    },
  },
  security: {
    'protect-pdf': {
      title: 'Protect PDF',
      description: 'Add password protection to secure your PDF files',
      icon: Lock,
      acceptedFormats: ['.pdf'],
      maxFiles: 20,
      actionText: 'Add Protection',
    },
    'unlock-pdf': {
      title: 'Unlock PDF',
      description: 'Remove password protection from PDF files',
      icon: Unlock,
      acceptedFormats: ['.pdf'],
      maxFiles: 10,
      actionText: 'Remove Protection',
    },
  },
};

export const getToolConfig = (category: string, toolType: string): ToolConfig | null => {
  return toolConfigs[category]?.[toolType] || null;
};