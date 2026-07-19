import { AlertTriangle } from 'lucide-react';

type Props = {
  message: string;
  onClose: () => void;
};

export default function ExportPrompt({ message, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="export-pattern-error-title"
        aria-describedby="export-pattern-error-message"
        className="w-full max-w-md rounded-lg border border-red-300 bg-lumina-surface p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span className="rounded-full bg-red-100 p-2 text-red-600">
            <AlertTriangle size={20} />
          </span>
          <div>
            <h2 id="export-pattern-error-title" className="text-lg font-semibold text-lumina-text">
              Answer pattern needs attention
            </h2>
            <p id="export-pattern-error-message" className="mt-2 text-sm leading-relaxed text-lumina-secondary">
              {message}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="rounded bg-lumina-primary px-4 py-2 text-sm font-semibold text-lumina-on-primary hover:bg-lumina-primary-hover"
          >
            Fix Pattern
          </button>
        </div>
      </div>
    </div>
  );
}
