import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code, ArrowRight, FileText, Globe } from 'lucide-react';

interface HTMLInputProps {
  onHtmlSubmit: (html: string) => void;
  title: string;
  subtitle: string;
}

const HTMLInput: React.FC<HTMLInputProps> = ({ onHtmlSubmit, title, subtitle }) => {
  const [html, setHtml] = useState('');
  const [inputMode, setInputMode] = useState<'html' | 'url'>('html');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (html.trim()) {
      onHtmlSubmit(html);
    }
  };

  const sampleHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Sample Document</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; border-bottom: 2px solid #007acc; }
        .highlight { background-color: #fff3cd; padding: 10px; }
    </style>
</head>
<body>
    <h1>Sample HTML Document</h1>
    <p>This is a sample HTML document that will be converted to PDF.</p>
    <div class="highlight">
        <strong>Note:</strong> You can include CSS styles, images, and formatted text.
    </div>
    <ul>
        <li>Bullet point 1</li>
        <li>Bullet point 2</li>
        <li>Bullet point 3</li>
    </ul>
</body>
</html>`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="border-2 border-dashed border-blueprint-600 rounded-2xl p-8 hover:border-blueprint-500 transition-colors">
        <div className="space-y-6">
          <div className="inline-flex p-6 bg-accent-cyan/10 rounded-2xl">
            <Code className="h-12 w-12 text-blueprint-400" strokeWidth={1} />
          </div>
          
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-blueprint-100 mb-2">{title}</h3>
            <p className="text-blueprint-400 mb-6">{subtitle}</p>
          </div>

          {/* Input Mode Toggle */}
          <div className="flex justify-center mb-4">
            <div className="bg-blueprint-800 rounded-lg p-1 flex">
              <button
                type="button"
                onClick={() => setInputMode('html')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                  inputMode === 'html'
                    ? 'bg-accent-cyan text-blueprint-900'
                    : 'text-blueprint-300 hover:text-blueprint-100'
                }`}
              >
                <Code className="h-4 w-4" />
                <span>HTML Code</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('url')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                  inputMode === 'url'
                    ? 'bg-accent-cyan text-blueprint-900'
                    : 'text-blueprint-300 hover:text-blueprint-100'
                }`}
              >
                <Globe className="h-4 w-4" />
                <span>URL</span>
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            {inputMode === 'html' ? (
              <>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-blueprint-200">
                      HTML Content
                    </label>
                    <button
                      type="button"
                      onClick={() => setHtml(sampleHtml)}
                      className="text-xs text-accent-cyan hover:text-accent-cyan/80 transition-colors"
                    >
                      Load Sample HTML
                    </button>
                  </div>
                  <textarea
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    placeholder="Paste your HTML code here..."
                    className="w-full h-64 px-4 py-3 bg-blueprint-800 border border-blueprint-700 rounded-xl text-blueprint-100 placeholder-blueprint-500 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan font-mono text-sm"
                  />
                </div>
                
                {/* HTML Tips */}
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-4">
                  <h4 className="text-blue-400 font-medium mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    HTML Tips
                  </h4>
                  <ul className="text-blue-300 text-sm space-y-1">
                    <li>• Include complete HTML with &lt;html&gt;, &lt;head&gt;, and &lt;body&gt; tags</li>
                    <li>• CSS styles in &lt;style&gt; tags will be preserved</li>
                    <li>• Use absolute URLs for images (e.g., https://example.com/image.jpg)</li>
                    <li>• Avoid JavaScript - it won't execute in the PDF</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-blueprint-200 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 bg-blueprint-800 border border-blueprint-700 rounded-xl text-blueprint-100 placeholder-blueprint-500 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan"
                  />
                </div>
                
                {/* URL Limitations Warning */}
                <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 mb-4">
                  <h4 className="text-yellow-400 font-medium mb-2 flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    URL Conversion Limitations
                  </h4>
                  <ul className="text-yellow-300 text-sm space-y-1">
                    <li>• Many websites block automated capture for security</li>
                    <li>• CORS policies may prevent access to external sites</li>
                    <li>• For best results, use your browser's "Print to PDF" feature</li>
                    <li>• Consider using HTML input mode for reliable conversion</li>
                  </ul>
                </div>
              </>
            )}
            
            <button
              type="submit"
              disabled={!html.trim()}
              className={`w-full px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center ${
                html.trim()
                  ? 'bg-accent-cyan text-blueprint-900 hover:bg-accent-cyan/90 hover:scale-105'
                  : 'bg-blueprint-700 text-blueprint-400 cursor-not-allowed'
              }`}
            >
              <span>Convert to PDF</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default HTMLInput;