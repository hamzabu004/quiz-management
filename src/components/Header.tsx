import React from 'react';
import { Search } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Header({ searchQuery, setSearchQuery }: HeaderProps) {
  return (
    <header className="h-16 border-b border-lumina-border bg-lumina-surface px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
      {/* Left side Workspace Title */}
      <div className="flex items-center gap-3">
        <span className="font-sans font-semibold text-sm tracking-tight text-lumina-text uppercase">
          Private Tutor MCQ Workspace
        </span>
      </div>

      
    </header>
  );
}
