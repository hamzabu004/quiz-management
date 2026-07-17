import React from 'react';
import './globals.css';
import Sidebar from '../src/components/Sidebar';

export const metadata = {
  title: 'Lumina Pro',
  description: 'Private Tutor Suite',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />
      </head>
      <body className="flex bg-app-bg text-lumina-text h-screen overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <main className="flex-1 overflow-hidden flex flex-col bg-app-bg">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
