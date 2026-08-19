import { useEffect, useState } from 'react';
import { Activity, RefreshCw, Upload, Columns, AlertOctagon, Loader2 } from 'lucide-react';
import axios from 'axios';
import { UploadZone } from './components/UploadZone';
import { TextPreview } from './components/TextPreview';
import { AgileDashboard } from './components/AgileDashboard';
import type { Epic, UserStory, Task, AcceptanceCriteria } from './components/AgileDashboard';
import { AmbiguityDashboard } from './components/AmbiguityDashboard';
import type { AmbiguityFlag } from './components/AmbiguityDashboard';
import { ExportPanel } from './components/ExportPanel';

interface HealthData {
  status: string;
  database: string;
}

function App() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [documentId, setDocumentId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  
  const [currentView, setCurrentView] = useState<string>('upload');
  const [loadingAnalyze, setLoadingAnalyze] = useState<boolean>(false);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [ambiguities, setAmbiguities] = useState<AmbiguityFlag[]>([]);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    let active = true;
    setLoadingHealth(true);
    setHealthError(null);
    
    axios.get<HealthData>(`${apiBaseUrl}/health`)
      .then(response => {
        if (active) {
          setHealth(response.data);
          setLoadingHealth(false);
        }
      })
      .catch(err => {
        if (active) {
          setHealthError(err.message || 'Failed to connect to backend server');
          setLoadingHealth(false);
        }
      });

    return () => {
      active = false;
    };
  }, [apiBaseUrl]);

  const handleUploadSuccess = (docId: string, text: string, name: string) => {
    setDocumentId(docId);
    setExtractedText(text);
    setFilename(name);
    setEpics([]);
    setAmbiguities([]);
    setCurrentView('upload');
  };

  const handleProceedToAnalyze = async () => {
    if (!documentId) return;
    setLoadingAnalyze(true);
    try {
      const response = await axios.post(`${apiBaseUrl}/analyze/${documentId}`);
      const data = response.data;
      setEpics(data.epics || []);
      setAmbiguities(data.ambiguities || []);
      setCurrentView('review');
    } catch (err: any) {
      alert("Failed to analyze requirements: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoadingAnalyze(false);
    }
  };

  const handleUpdateStory = async (storyId: string, fields: Partial<UserStory>) => {
    try {
      const response = await axios.put(`${apiBaseUrl}/artifacts/stories/${storyId}`, fields);
      setEpics(prevEpics => prevEpics.map(epic => ({
        ...epic,
        stories: epic.stories.map(story => 
          story.id === storyId ? { ...story, ...response.data } : story
        )
      })));
    } catch (err: any) {
      alert("Failed to update story: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleUpdateTask = async (taskId: string, fields: Partial<Task>) => {
    try {
      const response = await axios.put(`${apiBaseUrl}/artifacts/tasks/${taskId}`, fields);
      setEpics(prevEpics => prevEpics.map(epic => ({
        ...epic,
        stories: epic.stories.map(story => ({
          ...story,
          tasks: story.tasks.map(task =>
            task.id === taskId ? { ...task, ...response.data } : task
          )
        }))
      })));
    } catch (err: any) {
      alert("Failed to update task: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleUpdateCriteria = async (criteriaId: string, fields: Partial<AcceptanceCriteria>) => {
    try {
      const response = await axios.put(`${apiBaseUrl}/artifacts/criteria/${criteriaId}`, fields);
      setEpics(prevEpics => prevEpics.map(epic => ({
        ...epic,
        stories: epic.stories.map(story => ({
          ...story,
          criteria: story.criteria.map(crit =>
            crit.id === criteriaId ? { ...crit, ...response.data } : crit
          )
        }))
      })));
    } catch (err: any) {
      alert("Failed to update criteria: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleUpdateAmbiguityStatus = async (flagId: string, status: string) => {
    try {
      const response = await axios.put(`${apiBaseUrl}/artifacts/ambiguities/${flagId}`, { status });
      setAmbiguities(prevAmbiguities => prevAmbiguities.map(flag =>
        flag.id === flagId ? { ...flag, ...response.data } : flag
      ));
    } catch (err: any) {
      alert("Failed to update ambiguity: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleExportSuccess = (exportedStories: any[]) => {
    setEpics(prevEpics => prevEpics.map(epic => ({
      ...epic,
      stories: epic.stories.map(story => {
        const match = exportedStories.find(e => e.story_id === story.id);
        if (match) {
          return {
            ...story,
            github_issue_url: match.github_url,
            github_issue_number: match.issue_number
          };
        }
        return story;
      })
    })));
  };

  const approvedStoriesCount = epics.reduce(
    (count, epic) => count + epic.stories.filter(s => s.status === 'approved').length,
    0
  );

  const totalStories = epics.reduce((count, epic) => count + epic.stories.length, 0);
  const activeAmbiguities = ambiguities.filter(a => a.status === 'active').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-300 py-4 px-8 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-md">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">ReqFlow</h1>
              <p className="text-sm text-slate-600">AI Requirement-to-User Stories Generator</p>
            </div>
          </div>
          
          {epics.length > 0 && (
            <nav className="flex bg-slate-100 p-1 rounded-xl border border-slate-300">
              <button
                onClick={() => setCurrentView('upload')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  currentView === 'upload'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload</span>
              </button>
              <button
                onClick={() => setCurrentView('review')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  currentView === 'review'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Columns className="h-3.5 w-3.5" />
                <span>Agile Board</span>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">
                  {totalStories}
                </span>
              </button>
              <button
                onClick={() => setCurrentView('ambiguities')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  currentView === 'ambiguities'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertOctagon className="h-3.5 w-3.5" />
                <span>Ambiguities</span>
                {activeAmbiguities > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 animate-pulse">
                    {activeAmbiguities}
                  </span>
                )}
              </button>
            </nav>
          )}

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-semibold text-slate-600">API:</span>
              {loadingHealth ? (
                <span className="text-slate-600 animate-spin"><RefreshCw className="h-3.5 w-3.5" /></span>
              ) : healthError ? (
                <span className="text-rose-600 font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">Offline</span>
              ) : (
                <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Online</span>
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="font-semibold text-slate-600">DB:</span>
              {loadingHealth ? (
                <span className="text-slate-600 animate-spin"><RefreshCw className="h-3.5 w-3.5" /></span>
              ) : healthError || !health || health.database !== 'connected' ? (
                <span className="text-rose-600 font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">Offline</span>
              ) : (
                <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Connected</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-8 py-12 flex flex-col justify-start">
        {loadingAnalyze ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-16 w-16 text-indigo-600 animate-spin" />
            <h3 className="text-xl font-bold text-slate-900">Running AI Orchestration Pipeline...</h3>
            <p className="text-sm text-slate-600 max-w-md text-center leading-relaxed">
              ReqFlow is executing prompt chains to detect ambiguities, define epics, generate user stories, and break down tasks. This will take a moment.
            </p>
          </div>
        ) : currentView === 'upload' ? (
          <div className="space-y-8 max-w-5xl mx-auto w-full">
            <div className="bg-white rounded-2xl border border-slate-300 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-8 text-white relative">
                <div className="relative z-10">
                  <span className="bg-indigo-500/30 text-indigo-100 text-xs px-3 py-1 rounded-full font-medium border border-indigo-400/20">Phase 3 Ready</span>
                  <h2 className="text-3xl font-extrabold mt-3 tracking-tight">Upload Requirements</h2>
                  <p className="text-indigo-100 mt-2 text-base leading-relaxed max-w-2xl">
                    Upload your raw requirements specification document. ReqFlow will parse the file structure, extract clean text, and prepare it for story generation.
                  </p>
                </div>
                <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-white via-indigo-400 to-transparent pointer-events-none"></div>
              </div>

              <div className="p-8">
                <UploadZone onUploadSuccess={handleUploadSuccess} apiBaseUrl={apiBaseUrl} />
              </div>
            </div>

            {extractedText && filename && (
              <div>
                {documentId && (
                  <div className="text-xs text-slate-500 text-right mb-1 select-all">
                    Document ID: {documentId}
                  </div>
                )}
                <TextPreview
                  filename={filename}
                  extractedText={extractedText}
                  onProceedToAnalyze={handleProceedToAnalyze}
                  loadingAnalyze={loadingAnalyze}
                />
              </div>
            )}
          </div>
        ) : currentView === 'review' ? (
          <AgileDashboard
            epics={epics}
            onUpdateStory={handleUpdateStory}
            onUpdateTask={handleUpdateTask}
            onUpdateCriteria={handleUpdateCriteria}
            onOpenExport={() => setShowExportModal(true)}
            approvedCount={approvedStoriesCount}
          />
        ) : (
          <AmbiguityDashboard
            ambiguities={ambiguities}
            onUpdateStatus={handleUpdateAmbiguityStatus}
          />
        )}
      </main>

      {showExportModal && documentId && (
        <ExportPanel
          documentId={documentId}
          approvedCount={approvedStoriesCount}
          apiBaseUrl={apiBaseUrl}
          onClose={() => setShowExportModal(false)}
          onExportSuccess={handleExportSuccess}
        />
      )}

      {/* Footer */}
      <footer className="py-6 px-8 bg-slate-200 border-t border-slate-300 text-center text-xs text-slate-600 mt-auto">
        <p>&copy; 2026 ReqFlow AI Backlog Generator. Built for DevOps Hackathon Cairo.</p>
      </footer>
    </div>
  );
}

export default App;
