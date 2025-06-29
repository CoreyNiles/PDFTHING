import React from 'react';
import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface ToolHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

const ToolHeader: React.FC<ToolHeaderProps> = ({ title, description, icon: Icon }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center mb-8"
    >
      <div className="inline-flex p-4 bg-accent-cyan/10 rounded-2xl mb-6">
        <Icon className="h-12 w-12 text-accent-cyan" strokeWidth={1} />
      </div>
      <h1 className="text-4xl font-bold text-blueprint-100 mb-4">{title}</h1>
      <p className="text-xl text-blueprint-400 max-w-2xl mx-auto leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
};

export default ToolHeader;