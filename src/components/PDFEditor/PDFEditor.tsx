import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Download, Undo, Redo, ZoomIn, ZoomOut, RotateCcw, 
  Type, Image, Square, Circle, Minus, MousePointer, 
  Palette, Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Plus, Trash2, Copy, Move, Layers, Grid, Maximize2,
  FileText, Settings, Eye, EyeOff, Lock, Unlock
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
  strikethrough: boolean;
  alignment: 'left' | 'center' | 'right' | 'justify';
  rotation: number;
  locked: boolean;
  visible: boolean;
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
  locked: boolean;
  visible: boolean;
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
  locked: boolean;
  visible: boolean;
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Font options
  const fontFamilies = [
    'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 
    'Georgia', 'Verdana', 'Trebuchet MS', 'Comic Sans MS'
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
      content: 'New Text',
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#000000',
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      alignment: 'left',
      rotation: 0,
      locked: false,
      visible: true,
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
        locked: false,
        visible: true,
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
      locked: false,
      visible: true,
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
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

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
          y <= element.y + element.height &&
          element.visible
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
    // Update page numbers
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

  const duplicatePage = useCallback((pageIndex: number) => {
    const pageToClone = pages[pageIndex];
    const newPage: PDFPage = {
      ...JSON.parse(JSON.stringify(pageToClone)),
      id: `page-${pages.length + 1}`,
      pageNumber: pages.length + 1,
      elements: pageToClone.elements.map(el => ({
        ...el,
        id: generateId()
      }))
    };
    
    const updatedPages = [...pages];
    updatedPages.splice(pageIndex + 1, 0, newPage);
    
    // Update page numbers
    updatedPages.forEach((page, index) => {
      page.pageNumber = index + 1;
      page.id = `page-${index + 1}`;
    });
    
    setPages(updatedPages);
    addToHistory(updatedPages);
  }, [pages, addToHistory]);

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
          if (!element.visible) continue;
          
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
    await savePDF();
    const pdfDoc = await PDFDocument.create();
    
    for (const pageData of pages) {
      const page = pdfDoc.addPage([pageData.width, pageData.height]);
      // ... (same logic as savePDF)
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
          <p className="text-blueprint-100">Loading PDF Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-blueprint-900 z-50 flex flex-col ${isFullscreen ? 'p-0' : 'p-4'}`}>
      {/* Header Toolbar */}
      <div className="bg-blueprint-800 border-b border-blueprint-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-blueprint-100">PDF Editor</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 text-blueprint-400 hover:text-blueprint-100 disabled:opacity-50"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 text-blueprint-400 hover:text-blueprint-100 disabled:opacity-50"
            >
              <Redo className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
            className="p-2 text-blueprint-400 hover:text-blueprint-100"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-blueprint-100 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            className="p-2 text-blueprint-400 hover:text-blueprint-100"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          
          <div className="w-px h-6 bg-blueprint-600 mx-2" />
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-blueprint-400 hover:text-blueprint-100"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          
          <button
            onClick={savePDF}
            className="px-4 py-2 bg-accent-cyan text-blueprint-900 rounded-lg font-medium hover:bg-accent-cyan/90"
          >
            <Save className="h-4 w-4 mr-2 inline" />
            Save
          </button>
          
          <button
            onClick={downloadPDF}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2 inline" />
            Download
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blueprint-700 text-blueprint-100 rounded-lg font-medium hover:bg-blueprint-600"
          >
            Close
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tools */}
        <div className="w-64 bg-blueprint-800 border-r border-blueprint-700 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Tools */}
            <div>
              <h3 className="text-sm font-semibold text-blueprint-200 mb-3">Tools</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'select', icon: MousePointer, label: 'Select' },
                  { id: 'text', icon: Type, label: 'Text' },
                  { id: 'image', icon: Image, label: 'Image' },
                  { id: 'rectangle', icon: Square, label: 'Rectangle' },
                  { id: 'circle', icon: Circle, label: 'Circle' },
                  { id: 'line', icon: Minus, label: 'Line' },
                ].map((toolItem) => (
                  <button
                    key={toolItem.id}
                    onClick={() => setTool(toolItem.id as any)}
                    className={`p-3 rounded-lg border transition-colors ${
                      tool === toolItem.id
                        ? 'bg-accent-cyan text-blueprint-900 border-accent-cyan'
                        : 'bg-blueprint-900 text-blueprint-300 border-blueprint-600 hover:border-blueprint-500'
                    }`}
                  >
                    <toolItem.icon className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-xs">{toolItem.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Element Properties */}
            {selectedElementData && (
              <div>
                <h3 className="text-sm font-semibold text-blueprint-200 mb-3">Properties</h3>
                <div className="space-y-3">
                  {selectedElementData.type === 'text' && (
                    <>
                      <div>
                        <label className="block text-xs text-blueprint-400 mb-1">Content</label>
                        <textarea
                          value={selectedElementData.content}
                          onChange={(e) => updateElement(selectedElement!, { content: e.target.value })}
                          className="w-full px-2 py-1 bg-blueprint-900 border border-blueprint-600 rounded text-blueprint-100 text-sm"
                          rows={3}
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
                        <label className="block text-xs text-blueprint-400 mb-1">Font Family</label>
                        <select
                          value={selectedElementData.fontFamily}
                          onChange={(e) => updateElement(selectedElement!, { fontFamily: e.target.value })}
                          className="w-full px-2 py-1 bg-blueprint-900 border border-blueprint-600 rounded text-blueprint-100 text-sm"
                        >
                          {fontFamilies.map(font => (
                            <option key={font} value={font}>{font}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-blueprint-400 mb-1">Color</label>
                        <input
                          type="color"
                          value={selectedElementData.color}
                          onChange={(e) => updateElement(selectedElement!, { color: e.target.value })}
                          className="w-full h-8 bg-blueprint-900 border border-blueprint-600 rounded"
                        />
                      </div>
                      
                      <div className="flex space-x-1">
                        {[
                          { key: 'bold', icon: Bold },
                          { key: 'italic', icon: Italic },
                          { key: 'underline', icon: Underline },
                          { key: 'strikethrough', icon: Strikethrough },
                        ].map(({ key, icon: Icon }) => (
                          <button
                            key={key}
                            onClick={() => updateElement(selectedElement!, { 
                              [key]: !selectedElementData[key as keyof TextElement] 
                            })}
                            className={`p-1 rounded ${
                              selectedElementData[key as keyof TextElement]
                                ? 'bg-accent-cyan text-blueprint-900'
                                : 'bg-blueprint-900 text-blueprint-400 hover:text-blueprint-100'
                            }`}
                          >
                            <Icon className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {selectedElementData.type === 'image' && (
                    <>
                      <div>
                        <label className="block text-xs text-blueprint-400 mb-1">Width</label>
                        <input
                          type="number"
                          value={Math.round(selectedElementData.width)}
                          onChange={(e) => updateElement(selectedElement!, { width: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 bg-blueprint-900 border border-blueprint-600 rounded text-blueprint-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-blueprint-400 mb-1">Height</label>
                        <input
                          type="number"
                          value={Math.round(selectedElementData.height)}
                          onChange={(e) => updateElement(selectedElement!, { height: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 bg-blueprint-900 border border-blueprint-600 rounded text-blueprint-100 text-sm"
                        />
                      </div>
                    </>
                  )}
                  
                  <div>
                    <label className="block text-xs text-blueprint-400 mb-1">Rotation</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={selectedElementData.rotation}
                      onChange={(e) => updateElement(selectedElement!, { rotation: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-xs text-blueprint-400 text-center">{selectedElementData.rotation}°</div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateElement(selectedElement!, { visible: !selectedElementData.visible })}
                      className={`flex-1 p-2 rounded text-xs ${
                        selectedElementData.visible
                          ? 'bg-green-600 text-white'
                          : 'bg-blueprint-700 text-blueprint-300'
                      }`}
                    >
                      {selectedElementData.visible ? <Eye className="h-3 w-3 mx-auto" /> : <EyeOff className="h-3 w-3 mx-auto" />}
                    </button>
                    <button
                      onClick={() => updateElement(selectedElement!, { locked: !selectedElementData.locked })}
                      className={`flex-1 p-2 rounded text-xs ${
                        selectedElementData.locked
                          ? 'bg-red-600 text-white'
                          : 'bg-blueprint-700 text-blueprint-300'
                      }`}
                    >
                      {selectedElementData.locked ? <Lock className="h-3 w-3 mx-auto" /> : <Unlock className="h-3 w-3 mx-auto" />}
                    </button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => duplicateElement(selectedElement!)}
                      className="flex-1 p-2 bg-blueprint-700 text-blueprint-100 rounded text-xs hover:bg-blueprint-600"
                    >
                      <Copy className="h-3 w-3 mx-auto" />
                    </button>
                    <button
                      onClick={() => deleteElement(selectedElement!)}
                      className="flex-1 p-2 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                    >
                      <Trash2 className="h-3 w-3 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

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
                <div className="relative shadow-2xl">
                  <canvas
                    ref={canvasRef}
                    width={pages[currentPageIndex].width * zoom}
                    height={pages[currentPageIndex].height * zoom}
                    onClick={handleCanvasClick}
                    className="bg-white cursor-crosshair"
                    style={{
                      width: pages[currentPageIndex].width * zoom,
                      height: pages[currentPageIndex].height * zoom,
                    }}
                  />
                  
                  {/* Render background */}
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
                  
                  {/* Render elements */}
                  {pages[currentPageIndex].elements
                    .filter(el => el.visible)
                    .sort((a, b) => a.zIndex - b.zIndex)
                    .map((element) => (
                      <div
                        key={element.id}
                        className={`absolute border-2 ${
                          selectedElement === element.id
                            ? 'border-accent-cyan'
                            : 'border-transparent hover:border-blueprint-400'
                        } ${element.locked ? 'cursor-not-allowed' : 'cursor-move'}`}
                        style={{
                          left: element.x * zoom,
                          top: element.y * zoom,
                          width: element.width * zoom,
                          height: element.height * zoom,
                          transform: `rotate(${element.rotation}deg)`,
                          zIndex: element.zIndex,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!element.locked) {
                            setSelectedElement(element.id);
                          }
                        }}
                      >
                        {element.type === 'text' && (
                          <div
                            className="w-full h-full flex items-center"
                            style={{
                              fontSize: element.fontSize * zoom,
                              fontFamily: element.fontFamily,
                              color: element.color,
                              fontWeight: element.bold ? 'bold' : 'normal',
                              fontStyle: element.italic ? 'italic' : 'normal',
                              textDecoration: `${element.underline ? 'underline' : ''} ${element.strikethrough ? 'line-through' : ''}`.trim(),
                              textAlign: element.alignment,
                              padding: '4px',
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
                        {selectedElement === element.id && !element.locked && (
                          <>
                            {/* Corner handles for resizing */}
                            <div className="absolute -top-1 -left-1 w-2 h-2 bg-accent-cyan border border-white cursor-nw-resize" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent-cyan border border-white cursor-ne-resize" />
                            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-accent-cyan border border-white cursor-sw-resize" />
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-accent-cyan border border-white cursor-se-resize" />
                            
                            {/* Rotation handle */}
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-500 border border-white rounded-full cursor-grab" />
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
                className="p-1 text-blueprint-400 hover:text-blueprint-100"
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicatePage(index);
                        }}
                        className="p-1 bg-blueprint-700 text-blueprint-300 rounded hover:text-blueprint-100"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
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