"use client";

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved === 'true') {
        setIsCollapsed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const menuItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const handleToggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar-collapsed', String(next));
      } catch (e) {
        console.error('Failed to save sidebar state to localStorage:', e);
      }
      return next;
    });
  };

  if (!isMounted) return <aside className="bg-lumina-surface border-r border-lumina-border flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none transition-all duration-300 w-64"></aside>;

  return (
    <aside className={`bg-lumina-surface border-r border-lumina-border flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Top Brand Section */}
      <div className={isCollapsed ? 'p-4' : 'p-6'}>
        <div className={`flex items-center mb-8 ${isCollapsed ? 'flex-col gap-4' : 'justify-between'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-lumina-primary flex items-center justify-center text-lumina-on-primary font-bold text-lg border border-lumina-border shadow-xs shrink-0">
              L
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-sans font-bold text-xl tracking-tight text-lumina-text flex items-center gap-1.5">
                  Lumina Pro
                </h1>
                <p className="text-[10px] font-mono tracking-widest text-lumina-primary uppercase">
                  Private Tutor Suite
                </p>
              </div>
            )}
          </div>

          <button 
            onClick={handleToggleCollapse} 
            className="p-1.5 rounded-md hover:bg-lumina-container-lowest text-lumina-secondary hover:text-lumina-primary transition-all cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-8 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full py-2.5 rounded-md flex items-center transition-all relative ${
                  isCollapsed ? 'justify-center px-0' : 'px-4 gap-3 text-left'
                } ${
                  isActive
                    ? 'bg-lumina-container-lowest text-lumina-primary border-l-2 border-lumina-primary font-medium'
                    : 'text-lumina-secondary hover:bg-lumina-container-lowest hover:text-lumina-primary'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={18} />
                {!isCollapsed && <span className="font-sans text-sm">{item.label}</span>}
                {isActive && !isCollapsed && (
                  <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-lumina-primary" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Support Utilities */}
      <div className={`border-t border-lumina-border ${isCollapsed ? 'p-4 flex justify-center' : 'p-6'}`}>
        <button 
          onClick={() => alert("Lumina Pro MCQ Suite Version 2.4.0\nSupport center, tutorials and documentation are active. Please refer to help panels.")}
          className={`w-full py-2.5 rounded-md text-lumina-secondary hover:bg-lumina-container-lowest hover:text-lumina-primary transition-all text-sm cursor-pointer flex items-center ${
            isCollapsed ? 'justify-center px-0' : 'px-4 gap-3 text-left'
          }`}
          title={isCollapsed ? "Help Center" : undefined}
        >
          <HelpCircle size={18} className="text-lumina-text-muted" />
          {!isCollapsed && <span>Help Center</span>}
        </button>
      </div>
    </aside>
  );
}
