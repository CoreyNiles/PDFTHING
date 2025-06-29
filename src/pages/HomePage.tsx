import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, RefreshCw, Edit3, Shield, Merge, Split, Download, Upload, Image, FileSpreadsheet, Presentation, Lock, Unlock, FileSignature as Signature, Eye, Scissors, RotateCcw, Compass as Compress, Search } from 'lucide-react';

const HomePage: React.FC = () => {
  const toolCategories = [
    {
      title: 'Convert Files',
      description: 'Transform your documents between formats',
      color: 'from-blue-500 to-cyan-500',
      tools: [
        { name: 'PDF to Word', icon: FileText, href: '/convert/pdf-to-word' },
        { name: 'PDF to Excel', icon: FileSpreadsheet, href: '/convert/pdf-to-excel' },
        { name: 'PDF to PowerPoint', icon: Presentation, href: '/convert/pdf-to-powerpoint' },
        { name: 'PDF to JPG', icon: Image, href: '/convert/pdf-to-jpg' },
        { name: 'Word to PDF', icon: Upload, href: '/convert/word-to-pdf' },
        { name: 'Excel to PDF', icon: Upload, href: '/convert/excel-to-pdf' },
        { name: 'JPG to PDF', icon: Upload, href: '/convert/jpg-to-pdf' },
        { name: 'HTML to PDF', icon: Upload, href: '/convert/html-to-pdf' },
      ]
    },
    {
      title: 'Organize & Optimize',
      description: 'Merge, split, and optimize your PDFs',
      color: 'from-green-500 to-teal-500',
      tools: [
        { name: 'Merge PDF', icon: Merge, href: '/organize/merge-pdf' },
        { name: 'Split PDF', icon: Split, href: '/organize/split-pdf' },
        { name: 'Organize PDF', icon: RefreshCw, href: '/organize/organize-pdf' },
        { name: 'Rotate PDF', icon: RotateCcw, href: '/organize/rotate-pdf' },
        { name: 'Compress PDF', icon: Compress, href: '/organize/compress-pdf' },
        { name: 'Delete Pages', icon: Scissors, href: '/organize/delete-pages' },
      ]
    },
    {
      title: 'Edit Content',
      description: 'Add text, images, and enhance your documents',
      color: 'from-purple-500 to-pink-500',
      tools: [
        { name: 'Edit PDF', icon: Edit3, href: '/edit/edit-pdf' },
        { name: 'Add Watermark', icon: Image, href: '/edit/add-watermark' },
        { name: 'Number Pages', icon: FileText, href: '/edit/number-pages' },
        { name: 'OCR PDF', icon: Search, href: '/edit/ocr-pdf' },
        { name: 'PDF Reader', icon: Eye, href: '/edit/pdf-reader' },
        { name: 'Crop PDF', icon: Scissors, href: '/edit/crop-pdf' },
      ]
    },
    {
      title: 'Security & Signatures',
      description: 'Protect and sign your documents',
      color: 'from-red-500 to-orange-500',
      tools: [
        { name: 'eSign PDF', icon: Signature, href: '/security/esign-pdf' },
        { name: 'Protect PDF', icon: Lock, href: '/security/protect-pdf' },
        { name: 'Unlock PDF', icon: Unlock, href: '/security/unlock-pdf' },
        { name: 'Redact PDF', icon: Shield, href: '/security/redact-pdf' },
      ]
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blueprint-900 via-blueprint-800 to-blueprint-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-blueprint-100 mb-6">
              Professional PDF 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-blue-400">
                {" "}Tools Suite
              </span>
            </h1>
            <p className="text-xl text-blueprint-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Convert, edit, organize, and secure your PDF documents with professional-grade tools. 
              Fast, secure, and designed for modern workflows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/convert/pdf-to-word"
                className="px-8 py-4 bg-accent-cyan text-blueprint-900 rounded-xl font-semibold hover:bg-accent-cyan/90 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-accent-cyan/25"
              >
                Start Converting
              </Link>
              <Link
                to="/organize/merge-pdf"
                className="px-8 py-4 bg-blueprint-800 text-blueprint-100 rounded-xl font-semibold hover:bg-blueprint-700 transition-all duration-200 border border-blueprint-600 hover:border-blueprint-500"
              >
                Organize Files
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tools Categories */}
      <section className="py-20 bg-blueprint-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-blueprint-100 mb-4">
              Complete PDF Toolkit
            </h2>
            <p className="text-xl text-blueprint-400 max-w-2xl mx-auto">
              Everything you need to work with PDF documents, from simple conversions to advanced editing
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {toolCategories.map((category, categoryIndex) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * categoryIndex }}
                className="bg-blueprint-800 rounded-2xl p-8 border border-blueprint-700 hover:border-blueprint-600 transition-all duration-300"
              >
                <div className="mb-6">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${category.color} mb-4`}>
                    <FileText className="h-6 w-6 text-white" strokeWidth={1} />
                  </div>
                  <h3 className="text-2xl font-bold text-blueprint-100 mb-2">{category.title}</h3>
                  <p className="text-blueprint-400">{category.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {category.tools.map((tool, toolIndex) => (
                    <Link
                      key={tool.name}
                      to={tool.href}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-blueprint-900 hover:bg-blueprint-750 transition-all duration-200 group border border-blueprint-700 hover:border-accent-cyan/50"
                    >
                      <tool.icon className="h-4 w-4 text-blueprint-400 group-hover:text-accent-cyan transition-colors" strokeWidth={1} />
                      <span className="text-sm font-medium text-blueprint-200 group-hover:text-blueprint-100 transition-colors">
                        {tool.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-blueprint-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blueprint-100 mb-4">
              Why Choose PDFTools Pro?
            </h2>
            <p className="text-xl text-blueprint-400 max-w-2xl mx-auto">
              Professional-grade tools with modern security and lightning-fast processing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center p-8 bg-blueprint-900 rounded-2xl border border-blueprint-800"
            >
              <div className="inline-flex p-4 bg-accent-cyan/10 rounded-2xl mb-6">
                <Shield className="h-8 w-8 text-accent-cyan" strokeWidth={1} />
              </div>
              <h3 className="text-xl font-semibold text-blueprint-100 mb-4">Secure Processing</h3>
              <p className="text-blueprint-400">
                All files are processed securely in your browser with modern encryption standards
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center p-8 bg-blueprint-900 rounded-2xl border border-blueprint-800"
            >
              <div className="inline-flex p-4 bg-accent-cyan/10 rounded-2xl mb-6">
                <RefreshCw className="h-8 w-8 text-accent-cyan" strokeWidth={1} />
              </div>
              <h3 className="text-xl font-semibold text-blueprint-100 mb-4">Lightning Fast</h3>
              <p className="text-blueprint-400">
                Advanced algorithms and optimized processing ensure your files are converted in seconds
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center p-8 bg-blueprint-900 rounded-2xl border border-blueprint-800"
            >
              <div className="inline-flex p-4 bg-accent-cyan/10 rounded-2xl mb-6">
                <Download className="h-8 w-8 text-accent-cyan" strokeWidth={1} />
              </div>
              <h3 className="text-xl font-semibold text-blueprint-100 mb-4">No Software Required</h3>
              <p className="text-blueprint-400">
                Works directly in your browser on any device. No downloads or installations required
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;