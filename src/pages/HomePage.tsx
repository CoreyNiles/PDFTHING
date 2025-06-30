import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, RefreshCw, Edit3, Shield, Merge, Split, Download, Upload, Image, FileSpreadsheet, Presentation, Lock, Unlock, Scissors, RotateCcw, Compass as Compress, Search, Zap, Users, Type, Globe } from 'lucide-react';

const HomePage: React.FC = () => {
  const toolCategories = [
    {
      title: 'PDF to Other Formats',
      description: 'Convert PDF documents to different file formats',
      color: 'from-blue-500 to-cyan-500',
      tools: [
        { name: 'PDF to Word', icon: FileText, href: '/convert/pdf-to-word' },
        { name: 'PDF to Excel', icon: FileSpreadsheet, href: '/convert/pdf-to-excel' },
        { name: 'PDF to PowerPoint', icon: Presentation, href: '/convert/pdf-to-powerpoint' },
        { name: 'PDF to Text', icon: Type, href: '/convert/pdf-to-txt' },
        { name: 'PDF to JPG', icon: Image, href: '/convert/pdf-to-jpg' },
      ]
    },
    {
      title: 'Convert to PDF',
      description: 'Transform documents and files into PDF format',
      color: 'from-green-500 to-teal-500',
      tools: [
        { name: 'Word to PDF', icon: Upload, href: '/convert/word-to-pdf' },
        { name: 'Excel to PDF', icon: Upload, href: '/convert/excel-to-pdf' },
        { name: 'PowerPoint to PDF', icon: Upload, href: '/convert/powerpoint-to-pdf' },
        { name: 'Text to PDF', icon: Upload, href: '/convert/txt-to-pdf' },
        { name: 'Images to PDF', icon: Upload, href: '/convert/jpg-to-pdf' },
        { name: 'URL to PDF', icon: Globe, href: '/convert/url-to-pdf' },
      ]
    },
    {
      title: 'Organize & Optimize',
      description: 'Merge, split, and optimize your PDFs',
      color: 'from-purple-500 to-pink-500',
      tools: [
        { name: 'Merge PDF', icon: Merge, href: '/organize/merge-pdf' },
        { name: 'Split PDF', icon: Split, href: '/organize/split-pdf' },
        { name: 'Rotate PDF', icon: RotateCcw, href: '/organize/rotate-pdf' },
        { name: 'Compress PDF', icon: Compress, href: '/organize/compress-pdf' },
        { name: 'Delete Pages', icon: Scissors, href: '/organize/delete-pages' },
      ]
    },
    {
      title: 'Edit & Security',
      description: 'Edit content and secure your documents',
      color: 'from-red-500 to-orange-500',
      tools: [
        { name: 'Edit PDF', icon: Edit3, href: '/edit/edit-pdf' },
        { name: 'Add Watermark', icon: Image, href: '/edit/add-watermark' },
        { name: 'Number Pages', icon: FileText, href: '/edit/number-pages' },
        { name: 'OCR PDF', icon: Search, href: '/edit/ocr-pdf' },
        { name: 'Protect PDF', icon: Lock, href: '/security/protect-pdf' },
        { name: 'Unlock PDF', icon: Unlock, href: '/security/unlock-pdf' },
      ]
    },
  ];

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Process files instantly with no waiting time',
      color: 'text-yellow-400'
    },
    {
      icon: Users,
      title: 'No Account Required',
      description: 'Start using all tools immediately without signing up',
      color: 'text-blue-400'
    },
    {
      icon: Download,
      title: 'Completely Free',
      description: 'All features available at no cost, no hidden fees',
      color: 'text-green-400'
    }
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
              All-in-One PDF 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-blue-400">
                {" "}Tools
              </span>
            </h1>
            <p className="text-xl text-blueprint-300 mb-4 max-w-3xl mx-auto leading-relaxed">
              Convert, edit, organize, and secure your PDF documents with professional tools. 
              <strong className="text-blueprint-100"> Lightning fast</strong> and completely free.
            </p>
            <p className="text-lg text-blueprint-400 mb-8 max-w-2xl mx-auto">
              No accounts, no limits, no costs. Just powerful PDF processing.
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

      {/* Features Section */}
      <section className="py-16 bg-blueprint-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-blueprint-100 mb-4">
              Simple, Fast, Free
            </h2>
            <p className="text-xl text-blueprint-400 max-w-2xl mx-auto">
              Professional PDF tools that work instantly in your browser
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="text-center p-6 bg-blueprint-900 rounded-2xl border border-blueprint-800 hover:border-blueprint-700 transition-colors"
              >
                <div className="inline-flex p-4 bg-blueprint-800 rounded-2xl mb-4">
                  <feature.icon className={`h-8 w-8 ${feature.color}`} strokeWidth={1} />
                </div>
                <h3 className="text-xl font-semibold text-blueprint-100 mb-3">{feature.title}</h3>
                <p className="text-blueprint-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
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
              Everything you need to work with PDF documents
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {toolCategories.map((category, categoryIndex) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * categoryIndex }}
                className="bg-blueprint-800 rounded-2xl p-8 border border-blueprint-700 hover:border-blueprint-600 transition-all duration-300 hover:shadow-xl hover:shadow-blueprint-900/50"
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
                      className="flex items-center space-x-3 p-3 rounded-lg bg-blueprint-900 hover:bg-blueprint-750 transition-all duration-200 group border border-blueprint-700 hover:border-accent-cyan/50 hover:shadow-lg"
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
    </div>
  );
};

export default HomePage;