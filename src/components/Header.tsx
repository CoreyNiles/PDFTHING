import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Convert', href: '/convert/pdf-to-word' },
    { name: 'Organize', href: '/organize/merge-pdf' },
    { name: 'Edit', href: '/edit/edit-pdf' },
    { name: 'Security', href: '/security/protect-pdf' },
  ];

  const isActive = (href: string) => {
    return location.pathname.startsWith(href.split('/')[1]);
  };

  return (
    <header className="bg-blueprint-950 border-b border-blueprint-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-accent-cyan/10 rounded-lg group-hover:bg-accent-cyan/20 transition-colors">
              <FileText className="h-6 w-6 text-accent-cyan" strokeWidth={1} />
            </div>
            <span className="text-xl font-semibold text-blueprint-100">
              PDFTools <span className="text-accent-cyan">Pro</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-accent-cyan/20 text-accent-cyan'
                    : 'text-blueprint-300 hover:text-blueprint-100 hover:bg-blueprint-800'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-blueprint-300 hover:text-blueprint-100 hover:bg-blueprint-800 transition-colors"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-blueprint-900 border-t border-blueprint-800"
          >
            <nav className="px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-accent-cyan/20 text-accent-cyan'
                      : 'text-blueprint-300 hover:text-blueprint-100 hover:bg-blueprint-800'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;