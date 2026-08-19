import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { GitBranch, ExternalLink, Loader2, CheckCircle2, X, AlertCircle, ShieldCheck } from 'lucide-react';

interface ExportedIssue {
  story_id: string;
  title: string;
  github_url: string;
  issue_number: number;
}

interface ExportPanelProps {
  documentId: string;
  approvedCount: number;
  apiBaseUrl: string;
  onClose: () => void;
  onExportSuccess: (exportedStories: ExportedIssue[]) => void;
}

export function ExportPanel({ documentId, approvedCount, apiBaseUrl, onClose, onExportSuccess }: ExportPanelProps) {
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');
  const [saveLocal, setSaveLocal] = useState(true);
  const [hasServerToken, setHasServerToken] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportedIssues, setExportedIssues] = useState<ExportedIssue[]>([]);

  useEffect(() => {
    // Check if server has a pre-configured GitHub token
    fetch(`${apiBaseUrl}/export/config`)
      .then(res => res.json())
      .then(data => setHasServerToken(Boolean(data.has_server_token)))
      .catch(() => setHasServerToken(false));

    const savedRepo = localStorage.getItem('reqflow_gh_repo');
    const savedToken = localStorage.getItem('reqflow_gh_token');
    if (savedRepo) setRepo(savedRepo);
    if (savedToken) setToken(savedToken);
  }, [apiBaseUrl]);

  const handleExport = async (e: FormEvent) => {
    e.preventDefault();
    if (!repo.trim()) {
      setError("Please fill in the Repository name (e.g. username/repo).");
      return;
    }
    if (!hasServerToken && !token.trim()) {
      setError("Please provide a GitHub Personal Access Token or configure GITHUB_TOKEN in the server .env.");
      return;
    }

    setLoading(true);
    setError(null);

    if (saveLocal) {
      localStorage.setItem('reqflow_gh_repo', repo.trim());
      if (token.trim()) localStorage.setItem('reqflow_gh_token', token.trim());
    } else {
      localStorage.removeItem('reqflow_gh_repo');
      localStorage.removeItem('reqflow_gh_token');
    }

    try {
      const response = await fetch(`${apiBaseUrl}/export/${documentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: repo.trim(),
          token: token.trim() || undefined  // omit if empty — server will use env token
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Export failed.");
      }

      setExportedIssues(data.exported_stories || []);
      onExportSuccess(data.exported_stories || []);
    } catch (err: any) {
      setError(err.message || "Export failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl w-full max-w-lg overflow-hidden transition-all duration-300">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center space-x-2">
            <GitBranch className="h-5 w-5 text-indigo-600" />
            <span>Export to GitHub Issues</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {exportedIssues.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 text-emerald-600 bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                <CheckCircle2 className="h-6 w-6 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Backlog Export Completed!</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Successfully pushed {exportedIssues.length} user stories to GitHub.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Created Issues</h5>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {exportedIssues.map(issue => (
                    <a
                      key={issue.story_id}
                      href={issue.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 transition group text-xs font-semibold"
                    >
                      <span className="text-slate-800 group-hover:text-indigo-700 truncate max-w-sm">
                        #{issue.issue_number}: {issue.title}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition text-sm shadow-md"
              >
                Close Backlog Panel
              </button>
            </div>
          ) : (
            <form onSubmit={handleExport} className="space-y-5">
              {approvedCount === 0 ? (
                <div className="flex items-start space-x-3 bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-700">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">No Approved Stories Found</p>
                    <p className="mt-1 text-slate-600">
                      You must approve at least one user story on the Agile Board dashboard before exporting to GitHub.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-xs text-indigo-800">
                  Ready to export <span className="font-bold">{approvedCount}</span> approved user story tickets.
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                  GitHub Repository
                </label>
                <input
                  type="text"
                  placeholder="owner/repo (e.g. your-username/your-repo)"
                  value={repo}
                  onChange={e => setRepo(e.target.value)}
                  disabled={loading || approvedCount === 0}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-1 focus:ring-indigo-600 focus:outline-none disabled:bg-slate-50"
                />
                <p className="text-[10px] text-slate-500">
                  Format: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">username/repository-name</code> or paste the GitHub repo URL.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                  <span>Personal Access Token (PAT)</span>
                  {hasServerToken && (
                    <span className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[9px] font-bold normal-case">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Server token configured</span>
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  placeholder={hasServerToken ? "Using server token — optional override" : "ghp_..."}
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  disabled={loading || approvedCount === 0}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-1 focus:ring-indigo-600 focus:outline-none disabled:bg-slate-50"
                />
                <p className="text-[10px] text-slate-600 mt-1">
                  Needs <code className="bg-slate-200 px-1 rounded font-mono">repo</code> permissions to create issues.
                  {hasServerToken && <span className="text-emerald-600 ml-1">Leave blank to use the server-configured token.</span>}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="saveLocal"
                  checked={saveLocal}
                  onChange={e => setSaveLocal(e.target.checked)}
                  disabled={loading || approvedCount === 0}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="saveLocal" className="text-xs text-slate-600 cursor-pointer select-none">
                  Remember credentials in browser local storage
                </label>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-600 flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold">Export Failed</p>
                    <p className="mt-1 text-slate-600">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="w-1/2 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-xl border border-slate-300 transition text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || approvedCount === 0}
                  className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md transition text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <span>Export Backlog</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
