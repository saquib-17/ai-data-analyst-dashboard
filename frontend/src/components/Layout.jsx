import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children, darkMode, toggleDarkMode }) => {
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0B0F19] transition-colors duration-500 overflow-x-hidden font-sans">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-0 inset-x-0 h-screen overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[30%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl opacity-50 mix-blend-multiply dark:mix-blend-lighten" />
        <div className="absolute top-[20%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-purple-500/5 dark:bg-purple-500/10 blur-3xl opacity-50 mix-blend-multiply dark:mix-blend-lighten" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          {children}
        </main>
        
        <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-200/50 dark:border-slate-800/50">
          <p className="text-center text-sm font-medium text-slate-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} AI Analyst Platform
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
