import { AlertTriangle, Check, EyeOff, HelpCircle } from 'lucide-react';

export interface AmbiguityFlag {
  id: string;
  original_text: string;
  explanation: string;
  suggested_rewrite: string;
  status: string;
}

interface AmbiguityDashboardProps {
  ambiguities: AmbiguityFlag[];
  onUpdateStatus: (flagId: string, status: string) => Promise<void>;
}

export function AmbiguityDashboard({ ambiguities, onUpdateStatus }: AmbiguityDashboardProps) {
  if (ambiguities.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-300 p-12 text-center shadow-lg">
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full inline-block border border-emerald-100 mb-4">
          <Check className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">No Ambiguities Detected!</h3>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
          Your requirements text is clear, complete, and well-structured. No vague or ambiguous statements were flagged by the AI engine.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Ambiguity Flags</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Review requirements statements flagged by the AI engine as vague, incomplete, or ambiguous.
          </p>
        </div>
        <div className="bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-200 flex items-center space-x-1.5">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>{ambiguities.filter(a => a.status === 'active').length} Active Issues</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ambiguities.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden transition-all duration-300 flex flex-col justify-between ${
              item.status !== 'active' ? 'opacity-65' : ''
            }`}
          >
            <div>
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600 flex items-center space-x-1.5 uppercase tracking-wider">
                  <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Requirement Statement</span>
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    item.status === 'active'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : item.status === 'resolved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Original Text</h4>
                  <blockquote className="border-l-4 border-amber-500 bg-amber-50/30 pl-3 py-1.5 text-sm text-slate-800 font-mono italic">
                    "{item.original_text}"
                  </blockquote>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Explanation</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{item.explanation}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Suggested Rewrite</h4>
                  <p className="text-sm text-indigo-700 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 font-medium leading-relaxed">
                    "{item.suggested_rewrite}"
                  </p>
                </div>
              </div>
            </div>

            {item.status === 'active' && (
              <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex space-x-3 justify-end">
                <button
                  onClick={() => onUpdateStatus(item.id, 'ignored')}
                  className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 px-3 py-2 rounded-xl hover:bg-slate-100 transition"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>Ignore Statement</span>
                </button>
                <button
                  onClick={() => onUpdateStatus(item.id, 'resolved')}
                  className="flex items-center space-x-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl shadow-sm transition"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Accept Rewrite</span>
                </button>
              </div>
            )}
            
            {item.status !== 'active' && (
              <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => onUpdateStatus(item.id, 'active')}
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  Reopen Ambiguity Issue
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
