import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileText, AlertCircle, Loader2 } from 'lucide-react';

interface UploadZoneProps {
  onUploadSuccess: (docId: string, extractedText: string, filename: string) => void;
  apiBaseUrl: string;
}

export function UploadZone({ onUploadSuccess, apiBaseUrl }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const uploadFile = async (file: File) => {
    setLoading(true);
    setError(null);

    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError("File size exceeds 20MB limit.");
      setLoading(false);
      return;
    }

    const supportedExtensions = ["pdf", "docx", "txt"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !supportedExtensions.includes(ext)) {
      setError("Unsupported file type. Please upload a PDF, DOCX, or TXT document.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${apiBaseUrl}/documents/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Upload or parsing failed.");
      }

      const data = await response.json();
      onUploadSuccess(data.id, data.extracted_text, data.filename);
    } catch (err: any) {
      setError(err.message || "An error occurred during file upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all duration-300 ${
          isDragActive
            ? "border-indigo-600 bg-indigo-50/50 shadow-inner"
            : "border-slate-300 bg-white hover:border-indigo-500 hover:shadow-md"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt"
          onChange={handleChange}
          disabled={loading}
        />

        {loading ? (
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-600">Uploading and parsing document...</p>
            <p className="text-xs text-slate-600">This may take a moment for larger files.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-indigo-50 p-4 rounded-full border border-indigo-100 text-indigo-600">
              <UploadCloud className="h-10 w-10" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">
                Drag & drop your requirements document here
              </p>
              <p className="text-sm text-slate-600 mt-1">
                or <span className="text-indigo-600 font-semibold hover:underline">browse files</span> from your computer
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
              <FileText className="h-3.5 w-3.5" />
              <span>Supports PDF, DOCX, TXT (up to 20MB)</span>
            </div>
          </div>
        )}

        {isDragActive && (
          <div className="absolute inset-0 bg-indigo-600/5 rounded-2xl pointer-events-none border border-indigo-600"></div>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3 text-rose-600">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Error Uploading Document</p>
            <p className="mt-1 text-slate-600">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
