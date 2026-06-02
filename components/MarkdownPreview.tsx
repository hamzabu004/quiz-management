"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

type MarkdownPreviewProps = {
  content: string;
  className?: string;
};

class MarkdownErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <MarkdownErrorBoundary
      fallback={<pre className="whitespace-pre-wrap text-base">{content}</pre>}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        className={`prose prose-invert max-w-none text-2xl ${className ?? ""}`}
      >
        {content || ""}
      </ReactMarkdown>
    </MarkdownErrorBoundary>
  );
}

