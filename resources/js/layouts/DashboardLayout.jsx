import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardLayout = ({ children, noScroll = false }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="h-screen w-screen bg-[#f8fafc] overflow-hidden relative flex flex-col font-sans">
      {/* Abstract Background Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-teal-100/30 rounded-full blur-[150px]" />
      </div>

      <div className="flex flex-1 relative z-10 overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        {/* Main Content */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out`}>
          <Header />
          <main className={`flex-1 p-6 lg:p-8 ${
            noScroll
              ? 'overflow-hidden flex flex-col min-h-0'
              : 'overflow-y-auto custom-scrollbar'
          }`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
