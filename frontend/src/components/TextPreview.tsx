import { useState } from 'react';
import { FileText, Copy, Check, ArrowRight } from 'lucide-react';

interface TextPreviewProps {
  filename: string;
  extractedText: string;
  onProceedToAnalyze: () => void;
  loadingAnalyze: boolean;
}

export function TextPreview({ filename, extractedText, onProceedToAnalyze, loadingAnalyze }: TextPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden mt-8 transition-all duration-300">
      <div className="bg-slate-50 border-b border-slate-300 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 text-slate-800">
          <FileText className="h-5 w-5 text-indigo-600" />
          <span className="font-semibold truncate max-w-md">{filename}</span>
          <span className="bg-slate-200 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
            Parsed Text
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-600 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Text</span>
            </>
          )}
        </button>
      </div>

      <div className="p-6">
        <div className="max-h-96 overflow-y-auto bg-slate-950 text-slate-200 p-5 rounded-xl border border-slate-800 font-mono text-sm leading-relaxed whitespace-pre-wrap">
          {extractedText}
        </div>

        <div className="flex justify-between items-center mt-6 pt-5 border-t border-slate-300">
          <div>
            <p className="text-xs text-slate-600">
              Characters parsed: <span className="font-semibold text-slate-900">{extractedText.length}</span>
            </p>
          </div>
          <button
            onClick={onProceedToAnalyze}
            disabled={loadingAnalyze}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition disabled:opacity-50"
          >
            <span>Proceed to Analysis</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
