import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, Download, Undo, Redo, ZoomIn, ZoomOut, 
  Type, Image, Square, Circle, Minus, MousePointer, 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Plus, Trash2, Copy, RotateCcw, Palette, X, FileText,
  Move, Layers, Grid, Maximize2, Settings
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { saveAs } from 'file-saver';

// Types
interface TextElement {
  id: string;
  type: 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  alignment: 'left' | 'center' | 'right';
  rotation: number;
  zIndex: number;
}

interface ImageElement {
  id: string;
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  rotation: number;
  zIndex: number;
}

interface ShapeElement {
  id: string;
  type: 'rectangle' | 'circle' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  rotation: number;
  zIndex: number;
}

type Element = TextElement | ImageElement | ShapeElement;

interface PDFPage {
  id: string;
  pageNumber: number;
  width: number;
  height: number;
  elements: Element[];
  backgroundImage?: string;
}

interface PDFEditorProps {
  file: File;
  onSave: (editedPdf: Blob) => void;
  onClose: () => void;
}

const PDFEditor: React.FC<PDFEditorProps> = ({ file, onSave, onClose }) => {
  // State
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'text' | 'image' | 'rectangle' | 'circle' | 'line'>('select');
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<PDFPage[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showGrid, setShowGrid] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'insert' | 'design' | 'layout'>('home');

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Font options
  const fontFamilies = [
    'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 
    'Georgia', 'Verdana', 'Trebuchet MS', 'Calibri'
  ];

  // Load PDF
  useEffect(() => {
    loadPDF();
  }, [file]);

  const loadPDF = async () => {
    try {
      setIsLoading(true);
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const loadedPages: PDFPage[] = [];
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });
        
        // Create canvas for background
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const backgroundImage = canvas.toDataURL();
        
        loadedPages.push({
          id: `page-${pageNum}`,
          pageNumber: pageNum,
          width: viewport.width,
          height: viewport.height,
          elements: [],
          backgroundImage
        });
        
        canvas.remove();
      }
      
      setPages(loadedPages);
      addToHistory(loadedPages);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setIsLoading(false);
    }
  };

  // History management
  const addToHistory = useCallback((newPages: PDFPage[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newPages)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPages(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPages(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  }, [history, historyIndex]);

  // Element management
  const generateId = () => `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addTextElement = useCallback((x: number, y: number) => {
    const newElement: TextElement = {
      id: generateId(),
      type: 'text',
      x,
      y,
      width: 200,
      height: 30,
      content: 'Click to edit text',
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#000000',
      bold: false,
      italic: false,
      underline: false,
      alignment: 'left',
      rotation: 0,
      zIndex: pages[currentPageIndex]?.elements.length || 0
    };

    const updatedPages = [...pages];
    updatedPages[currentPageIndex].elements.push(newElement);
    setPages(updatedPages);
    addToHistory(updatedPages);
    setSelectedElement(newElement.id);
  }, [pages, currentPageIndex, addToHistory]);

  const addImageElement = useCallback((file: File, x: number, y: number) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newElement: ImageElement = {
        id: generateId(),
        type: 'image',
        x,
        y,
        width: 200,
        height: 150,
        src: e.target?.result as string,
        rotation: 0,
        zIndex: pages[currentPageIndex]?.elements.length || 0
      };

      const updatedPages = [...pages];
      updatedPages[currentPageIndex].elements.push(newElement);
      setPages(updatedPages);
      addToHistory(updatedPages);
      setSelectedElement(newElement.id);
    };
    reader.readAsDataURL(file);
  }, [pages, currentPageIndex, addToHistory]);

  const addShapeElement = useCallback((type: 'rectangle' | 'circle' | 'line', x: number, y: number) => {
    const newElement: ShapeElement = {
      id: generateId(),
      type,
      x,
      y,
      width: type === 'line' ? 100 : 100,
      height: type === 'line' ? 2 : 100,
      fillColor: type === 'line' ? 'transparent' : '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 2,
      rotation: 0,
      zIndex: pages[currentPageIndex]?.elements.length || 0
    };

    const updatedPages = [...pages];
    updatedPages[currentPageIndex].elements.push(newElement);
    setPages(updatedPages);
    addToHistory(updatedPages);
    setSelectedElement(newElement.id);
  }, [pages, currentPageIndex, addToHistory]);

  const updateElement = useCallback((elementId: string, updates: Partial<Element>) => {
    const updatedPages = [...pages];
    const elementIndex = updatedPages[currentPageIndex].elements.findIndex(el => el.id === elementId);
    if (elementIndex !== -1) {
      updatedPages[currentPageIndex].elements[elementIndex] = {
        ...updatedPages[currentPageIndex].elements[elementIndex],
        ...updates
      };
      setPages(updatedPages);
    }
  }, [pages, currentPageIndex]);

  const deleteElement = useCallback((elementId: string) => {
    const updatedPages = [...pages];
    updatedPages[currentPageIndex].elements = updatedPages[currentPageIndex].elements.filter(
      el => el.id !== elementId
    );
    setPages(updatedPages);
    addToHistory(updatedPages);
    setSelectedElement(null);
  }, [pages, currentPageIndex, addToHistory]);

  const duplicateElement = useCallback((elementId: string) => {
    const element = pages[currentPageIndex].elements.find(el => el.id === elementId);
    if (element) {
      const newElement = {
        ...element,
        id: generateId(),
        x: element.x + 20,
        y: element.y + 20,
        zIndex: pages[currentPageIndex].elements.length
      };
      
      const updatedPages = [...pages];
      updatedPages[currentPageIndex].elements.push(newElement);
      setPages(updatedPages);
      addToHistory(updatedPages);
      setSelectedElement(newElement.id);
    }
  }, [pages, currentPageIndex, addToHistory]);

  // Canvas interaction
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - 32) / zoom; // Account for padding
    const y = (e.clientY - rect.top - 32) / zoom;

    if (tool === 'text') {
      addTextElement(x, y);
      setTool('select');
    } else if (tool === 'rectangle') {
      addShapeElement('rectangle', x, y);
      setTool('select');
    } else if (tool === 'circle') {
      addShapeElement('circle', x, y);
      setTool('select');
    } else if (tool === 'line') {
      addShapeElement('line', x, y);
      setTool('select');
    } else if (tool === 'select') {
      // Check if clicking on an element
      const clickedElement = pages[currentPageIndex]?.elements
        .slice()
        .reverse()
        .find(element => 
          x >= element.x && 
          x <= element.x + element.width &&
          y >= element.y && 
          y <= element.y + element.height
        );
      
      setSelectedElement(clickedElement?.id || null);
    }
  }, [tool, zoom, pages, currentPageIndex, addTextElement, addShapeElement]);

  // Page management
  const addPage = useCallback(() => {
    const lastPage = pages[pages.length - 1];
    const newPage: PDFPage = {
      id: `page-${pages.length + 1}`,
      pageNumber: pages.length + 1,
      width: lastPage?.width || 595,
      height: lastPage?.height || 842,
      elements: []
    };
    
    const updatedPages = [...pages, newPage];
    setPages(updatedPages);
    addToHistory(updatedPages);
    setCurrentPageIndex(pages.length);
  }, [pages, addToHistory]);

  const deletePage = useCallback((pageIndex: number) => {
    if (pages.length <= 1) return;
    
    const updatedPages = pages.filter((_, index) => index !== pageIndex);
    updatedPages.forEach((page, index) => {
      page.pageNumber = index + 1;
      page.id = `page-${index + 1}`;
    });
    
    setPages(updatedPages);
    addToHistory(updatedPages);
    
    if (currentPageIndex >= updatedPages.length) {
      setCurrentPageIndex(updatedPages.length - 1);
    }
  }, [pages, currentPageIndex, addToHistory]);

  // Save functionality
  const savePDF = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      
      for (const pageData of pages) {
        const page = pdfDoc.addPage([pageData.width, pageData.height]);
        
        // Add background if exists
        if (pageData.backgroundImage) {
          try {
            const imageBytes = await fetch(pageData.backgroundImage).then(res => res.arrayBuffer());
            const image = await pdfDoc.embedPng(imageBytes);
            page.drawImage(image, {
              x: 0,
              y: 0,
              width: pageData.width,
              height: pageData.height,
            });
          } catch (e) {
            console.warn('Failed to embed background image:', e);
          }
        }
        
        // Sort elements by z-index
        const sortedElements = [...pageData.elements].sort((a, b) => a.zIndex - b.zIndex);
        
        for (const element of sortedElements) {
          if (element.type === 'text') {
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            page.drawText(element.content, {
              x: element.x,
              y: pageData.height - element.y - element.height,
              size: element.fontSize,
              font,
              color: rgb(
                parseInt(element.color.slice(1, 3), 16) / 255,
                parseInt(element.color.slice(3, 5), 16) / 255,
                parseInt(element.color.slice(5, 7), 16) / 255
              ),
              rotate: degrees(element.rotation),
            });
          } else if (element.type === 'image') {
            try {
              const imageBytes = await fetch(element.src).then(res => res.arrayBuffer());
              const image = element.src.includes('data:image/png') 
                ? await pdfDoc.embedPng(imageBytes)
                : await pdfDoc.embedJpg(imageBytes);
              
              page.drawImage(image, {
                x: element.x,
                y: pageData.height - element.y - element.height,
                width: element.width,
                height: element.height,
                rotate: degrees(element.rotation),
              });
            } catch (e) {
              console.warn('Failed to embed image:', e);
            }
          } else if (element.type === 'rectangle') {
            page.drawRectangle({
              x: element.x,
              y: pageData.height - element.y - element.height,
              width: element.width,
              height: element.height,
              color: element.fillColor !== 'transparent' ? rgb(
                parseInt(element.fillColor.slice(1, 3), 16) / 255,
                parseInt(element.fillColor.slice(3, 5), 16) / 255,
                parseInt(element.fillColor.slice(5, 7), 16) / 255
              ) : undefined,
              borderColor: rgb(
                parseInt(element.strokeColor.slice(1, 3), 16) / 255,
                parseInt(element.strokeColor.slice(3, 5), 16) / 255,
                parseInt(element.strokeColor.slice(5, 7), 16) / 255
              ),
              borderWidth: element.strokeWidth,
              rotate: degrees(element.rotation),
            });
          }
        }
      }
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      onSave(blob);
    } catch (error) {
      console.error('Error saving PDF:', error);
    }
  };

  const downloadPDF = async () => {
    const pdfDoc = await PDFDocument.create();
    
    for (const pageData of pages) {
      const page = pdfDoc.addPage([pageData.width, pageData.height]);
      
      if (pageData.backgroundImage) {
        try {
          const imageBytes = await fetch(pageData.backgroundImage).then(res => res.arrayBuffer());
          const image = await pdfDoc.embedPng(imageBytes);
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: pageData.width,
            height: pageData.height,
          });
        } catch (e) {
          console.warn('Failed to embed background image:', e);
        }
      }
      
      const sortedElements = [...pageData.elements].sort((a, b) => a.zIndex - b.zIndex);
      
      for (const element of sortedElements) {
        if (element.type === 'text') {
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          page.drawText(element.content, {
            x: element.x,
            y: pageData.height - element.y - element.height,
            size: element.fontSize,
            font,
            color: rgb(
              parseInt(element.color.slice(1, 3), 16) / 255,
              parseInt(element.color.slice(3, 5), 16) / 255,
              parseInt(element.color.slice(5, 7), 16) / 255
            ),
            rotate: degrees(element.rotation),
          });
        }
      }
    }
    
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, `edited-${file.name}`);
  };

  // Get selected element
  const selectedElementData = selectedElement 
    ? pages[currentPageIndex]?.elements.find(el => el.id === selectedElement)
    : null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-blueprint-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-cyan mx-auto mb-4"></div>
          <p className="text-blueprint-100 text-lg">Loading PDF Editor...</p>
          <p className="text-blueprint-400 text-sm mt-2">Preparing your document for editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-blueprint-900 z-50 flex flex-col">
      {/* Title Bar */}
      <div className="bg-blueprint-950 border-b border-blueprint-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-5 w-5 text-accent-cyan" />
          <span className="text-blueprint-100 font-medium">PDF Editor - {file.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-blueprint-400 hover:text-blueprint-100 hover:bg-blueprint-800 rounded"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-blueprint-400 hover:text-blueprint-100 hover:bg-blueprint-800 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Ribbon Toolbar */}
      <div className="bg-blueprint-800 border-b border-blueprint-700">
        {/* Tab Headers */}
        <div className="flex border-b border-blueprint-700">
          {[
            { id: 'home', label: 'Home' },
            { id: 'insert', label: 'Insert' },
            { id: 'design', label: 'Design' },
            { id: 'layout', label: 'Layout' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blueprint-700 text-blueprint-100 border-b-2 border-accent-cyan'
                  : 'text-blueprint-300 hover:text-blueprint-100 hover:bg-blueprint-750'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-3">
          {activeTab === 'home' && (
            <div className="flex items-center space-x-6">
              {/* File Operations */}
              <div className="flex items-center space-x-2 border-r border-blueprint-600 pr-6">
                <button
                  onClick={savePDF}
                  className="flex items-center space-x-2 px-3 py-2 bg-accent-cyan text-blueprint-900 rounded font-medium hover:bg-accent-cyan/90"
                >
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={downloadPDF}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
              </div>

              {/* History */}
              <div className="flex items-center space-x-1 border-r border-blueprint-600 pr-6">
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="p-2 text-blueprint-400 hover:text-blueprint-100 disabled:opacity-50 hover:bg-blueprint-700 rounded"
                  title="Undo"
                >
                  <Undo className="h-4 w-4" />
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-2 text-blueprint-400 hover:text-blueprint-100 disabled:opacity-50 hover:bg-blueprint-700 rounded"
                  title="Redo"
                >
                  <Redo className="h-4 w-4" />
                </button>
              </div>

              {/* Tools */}
              <div className="flex items-center space-x-1 border-r border-blueprint-600 pr-6">
                {[
                  { id: 'select', icon: MousePointer, label: 'Select' },
                  { id: 'text', icon: Type, label: 'Text' },
                ].map((toolItem) => (
                  <button
                    key={toolItem.id}
                    onClick={() => setTool(toolItem.id as any)}
                    className={`p-2 rounded transition-colors ${
                      tool === toolItem.id
                        ? 'bg-accent-cyan text-blueprint-900'
                        : 'text-blueprint-400 hover:text-blueprint-100 hover:bg-blueprint-700'
                    }`}
                    title={toolItem.label}
                  >
                    <toolItem.icon className="h-4 w-4" />
                  </button>
                ))}
              </div>

              {/* Text Formatting */}
              {selectedElementData?.type === 'text' && (
                <div className="flex items-center space-x-2 border-r border-blueprint-600 pr-6">
                  <select
                    value={selectedElementData.fontFamily}
                    onChange={(e) => updateElement(selectedElement!, { fontFamily: e.target.value })}
                    className="px-2 py-1 bg-blueprint-900 border border-blueprint-600 rounded text-blueprint-100 text-sm"
                  >
                    {fontFamilies.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                  
                  <input
                    type="number"
                    value={selectedElementData.fontSize}
                    onChange={(e) => updateElement(selectedElement!, { fontSize: parseInt(e.target.value) })}
                    className="w-16 px-2 py-1 bg-blueprint-900 border border-blueprint-600 rounded text-blueprint-100 text-sm"
                    min="8"
                    max="72"
                  />
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => updateElement(selectedElement!, { bold: !selectedElementData.bold })}
                      className={`p-1 rounded ${
                        selectedElementData.bold
                          ? 'bg-accent-cyan text-blueprint-900'
                          : 'text-blueprint-400 hover:text-blueprint-100 hover:bg-blueprint-700'
                      }`}
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => updateElement(selectedElement!, { italic: !selectedElementData.italic })}
                      className={`p-1 rounded ${
                        selectedElementData.italic
                          ? 'bg-accent-cyan text-blueprint-900'
                          : 'text-blueprint-400 hover:text-blueprint-100 hover:bg-blueprint-700'
                      }`}
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => updateElement(selectedElement!, { underline: !selectedElementData.underline })}
                      className={`p-1 rounded ${
                        selectedElementData.underline
                          ? 'bg-accent-cyan text-blueprint-900'
                          : 'text-blueprint-400 hover:text-blueprint-100 hover:bg-blueprint-700'
                      }`}
                    >
                      <Underline className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <input
                    type="color"
                    value={selectedElementData.color}
                    onChange={(e) => updateElement(selectedElement!, { color: e.target.value })}
                    className="w-8 h-8 bg-blueprint-900 border border-blueprint-600 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* Zoom */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                  className="p-2 text-blueprint-400 hover:text-blueprint-100 hover:bg-blueprint-700 rounded"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-blueprint-100 min-w-[60px] text-center text-sm">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                  className="p-2 text-blueprint-400 hover:text-blueprint-100 hover:bg-blueprint-700 rounded"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'insert' && (
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 border-r border-blueprint-600 pr-6">
                <button
                  onClick={() => setTool('text')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                    tool === 'text'
                      ? 'bg-accent-cyan text-blueprint-900'
                      : 'bg-blueprint-700 text-blueprint-100 hover:bg-blueprint-600'
                  }`}
                >
                  <Type className="h-4 w-4" />
                  <span>Text Box</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 px-3 py-2 bg-blueprint-700 text-blueprint-100 rounded hover:bg-blueprint-600"
                >
                  <Image className="h-4 w-4" />
                  <span>Image</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-blueprint-300 text-sm">Shapes:</span>
                <button
                  onClick={() => setTool('rectangle')}
                  className={`p-2 rounded transition-colors ${
                    tool === 'rectangle'
                      ? 'bg-accent-cyan text-blueprint-900'
                      : 'text-blueprint-400 hover:text-blueprint-100 hover:bg-blueprint-700'
                  }`}
                >
                  <Square className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setTool('circle')}
                  className={`p-2 rounded transition-colors ${
                    tool === 'circle'
                      ? 'bg-accent-cyan text-blueprint-900'
                      : 'text-blueprint-400 hover:text-blueprint-100 hover:bg-blueprint-700'
                  }`}
                >
                  <Circle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setTool('line')}
                  className={`p-2 rounded transition-colors ${
                    tool === 'line'
                      ? 'bg-accent-cyan text-blueprint-900'
                      : 'text-blueprint-400 hover:text-blueprint-100 hover:bg-blueprint-700'
                  }`}
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                    showGrid
                      ? 'bg-accent-cyan text-blueprint-900'
                      : 'bg-blueprint-700 text-blueprint-100 hover:bg-blueprint-600'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                  <span>Grid</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <button
                  onClick={addPage}
                  className="flex items-center space-x-2 px-3 py-2 bg-blueprint-700 text-blueprint-100 rounded hover:bg-blueprint-600"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Page</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas Container */}
          <div 
            ref={containerRef}
            className="flex-1 overflow-auto bg-blueprint-950 p-8"
            style={{
              backgroundImage: showGrid ? 
                'radial-gradient(circle, #374151 1px, transparent 1px)' : 'none',
              backgroundSize: showGrid ? '20px 20px' : 'auto'
            }}
          >
            <div className="mx-auto" style={{ width: 'fit-content' }}>
              {pages[currentPageIndex] && (
                <div 
                  className="relative shadow-2xl bg-white cursor-crosshair"
                  style={{
                    width: pages[currentPageIndex].width * zoom,
                    height: pages[currentPageIndex].height * zoom,
                  }}
                  onClick={handleCanvasClick}
                >
                  {/* Background */}
                  {pages[currentPageIndex].backgroundImage && (
                    <img
                      src={pages[currentPageIndex].backgroundImage}
                      alt="Page background"
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        width: pages[currentPageIndex].width * zoom,
                        height: pages[currentPageIndex].height * zoom,
                      }}
                    />
                  )}
                  
                  {/* Elements */}
                  {pages[currentPageIndex].elements
                    .sort((a, b) => a.zIndex - b.zIndex)
                    .map((element) => (
                      <div
                        key={element.id}
                        className={`absolute border-2 ${
                          selectedElement === element.id
                            ? 'border-accent-cyan bg-accent-cyan/10'
                            : 'border-transparent hover:border-blueprint-400'
                        } cursor-move`}
                        style={{
                          left: element.x * zoom,
                          top: element.y * zoom,
                          width: element.width * zoom,
                          height: element.height * zoom,
                          transform: `rotate(${element.rotation}deg)`,
                          zIndex: element.zIndex + 10,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedElement(element.id);
                        }}
                      >
                        {element.type === 'text' && (
                          <div
                            className="w-full h-full flex items-center px-2"
                            style={{
                              fontSize: element.fontSize * zoom,
                              fontFamily: element.fontFamily,
                              color: element.color,
                              fontWeight: element.bold ? 'bold' : 'normal',
                              fontStyle: element.italic ? 'italic' : 'normal',
                              textDecoration: element.underline ? 'underline' : 'none',
                              textAlign: element.alignment,
                            }}
                          >
                            {element.content}
                          </div>
                        )}
                        
                        {element.type === 'image' && (
                          <img
                            src={element.src}
                            alt="Element"
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        )}
                        
                        {element.type === 'rectangle' && (
                          <div
                            className="w-full h-full"
                            style={{
                              backgroundColor: element.fillColor !== 'transparent' ? element.fillColor : 'transparent',
                              border: `${element.strokeWidth}px solid ${element.strokeColor}`,
                            }}
                          />
                        )}
                        
                        {element.type === 'circle' && (
                          <div
                            className="w-full h-full rounded-full"
                            style={{
                              backgroundColor: element.fillColor !== 'transparent' ? element.fillColor : 'transparent',
                              border: `${element.strokeWidth}px solid ${element.strokeColor}`,
                            }}
                          />
                        )}
                        
                        {element.type === 'line' && (
                          <div
                            className="w-full"
                            style={{
                              height: element.strokeWidth,
                              backgroundColor: element.strokeColor,
                              marginTop: (element.height - element.strokeWidth) / 2,
                            }}
                          />
                        )}
                        
                        {/* Selection handles */}
                        {selectedElement === element.id && (
                          <>
                            <div className="absolute -top-1 -left-1 w-2 h-2 bg-accent-cyan border border-white cursor-nw-resize" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent-cyan border border-white cursor-ne-resize" />
                            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-accent-cyan border border-white cursor-sw-resize" />
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-accent-cyan border border-white cursor-se-resize" />
                          </>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Pages */}
        <div className="w-64 bg-blueprint-800 border-l border-blueprint-700 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-blueprint-200">Pages</h3>
              <button
                onClick={addPage}
                className="p-1 text-blueprint-400 hover:text-blueprint-100 hover:bg-blueprint-700 rounded"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  className={`relative group p-2 rounded-lg border cursor-pointer transition-colors ${
                    currentPageIndex === index
                      ? 'bg-accent-cyan/20 border-accent-cyan'
                      : 'bg-blueprint-900 border-blueprint-600 hover:border-blueprint-500'
                  }`}
                  onClick={() => setCurrentPageIndex(index)}
                >
                  <div className="aspect-[3/4] bg-white rounded mb-2 overflow-hidden">
                    {page.backgroundImage && (
                      <img
                        src={page.backgroundImage}
                        alt={`Page ${page.pageNumber}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  
                  <div className="text-xs text-blueprint-300 text-center">
                    Page {page.pageNumber}
                  </div>
                  
                  {/* Page actions */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-1">
                      {pages.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePage(index);
                          }}
                          className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      {selectedElementData && (
        <div className="bg-blueprint-800 border-t border-blueprint-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blueprint-200">Element Properties</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => duplicateElement(selectedElement!)}
                className="p-1 text-blueprint-400 hover:text-blueprint-100 hover:bg-blueprint-700 rounded"
                title="Duplicate"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                onClick={() => deleteElement(selectedElement!)}
                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
          
          {selectedElementData.type === 'text' && (
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-blueprint-400 mb-1">Content</label>
                <input
                  type="text"
                  value={selectedElementData.content}
                  onChange={(e) => updateElement(selectedElement!, { content: e.target.value })}
                  className="w-full px-2 py-1 bg-blueprint-900 border border-blueprint-600 rounded text-blueprint-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-blueprint-400 mb-1">Font Size</label>
                <input
                  type="number"
                  value={selectedElementData.fontSize}
                  onChange={(e) => updateElement(selectedElement!, { fontSize: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 bg-blueprint-900 border border-blueprint-600 rounded text-blueprint-100 text-sm"
                  min="8"
                  max="72"
                />
              </div>
              <div>
                <label className="block text-xs text-blueprint-400 mb-1">X Position</label>
                <input
                  type="number"
                  value={Math.round(selectedElementData.x)}
                  onChange={(e) => updateElement(selectedElement!, { x: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 bg-blueprint-900 border border-blueprint-600 rounded text-blueprint-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-blueprint-400 mb-1">Y Position</label>
                <input
                  type="number"
                  value={Math.round(selectedElementData.y)}
                  onChange={(e) => updateElement(selectedElement!, { y: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 bg-blueprint-900 border border-blueprint-600 rounded text-blueprint-100 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input for images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            addImageElement(file, 100, 100);
          }
        }}
      />
    </div>
  );
};

export default PDFEditor;