import React from 'react';
import { FileText, Zap, Users, Download } from 'lucide-react';

const Footer: React.FC = () => {
  const features = [
    { 
      icon: Zap, 
      title: 'Lightning Fast Processing', 
      desc: 'All files are processed instantly in your browser using advanced libraries' 
    },
    { 
      icon: Users, 
      title: 'No Accounts Required', 
      desc: 'Start using professional PDF tools immediately - completely free' 
    },
    { 
      icon: Download, 
      title: 'All-in-One Solution', 
      desc: 'Convert, edit, organize, and secure - everything you need in one place' 
    },
  ];

  return (
    <footer className="bg-blueprint-950 border-t border-blueprint-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="p-2 bg-accent-cyan/10 rounded-lg">
                <feature.icon className="h-5 w-5 text-accent-cyan" strokeWidth={1} />
              </div>
              <div>
                <h3 className="font-semibold text-blueprint-100 mb-1">{feature.title}</h3>
                <p className="text-sm text-blueprint-400">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-blueprint-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="p-2 bg-accent-cyan/10 rounded-lg">
              <FileText className="h-5 w-5 text-accent-cyan" strokeWidth={1} />
            </div>
            <span className="text-lg font-semibold text-blueprint-100">
              PDFTools <span className="text-accent-cyan">Pro</span>
            </span>
          </div>
          <div className="text-sm text-blueprint-400">
            © 2025 PDFTools Pro. Free PDF processing tools.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;