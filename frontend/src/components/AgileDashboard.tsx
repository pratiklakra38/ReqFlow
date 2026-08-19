import { useState } from 'react';
import {
  Layers, FileText, CheckSquare, FlaskConical,
  Edit2, Save, Check, X, ChevronDown, ChevronRight, GitBranch
} from 'lucide-react';

export interface AcceptanceCriteria {
  id: string;
  scenario: string;
  given_text: string;
  when_text: string;
  then_text: string;
}

export interface Task {
  id: string;
  title: string;
  priority: string; // High, Medium, Low
  description: string;
}

export interface TestScenario {
  id: string;
  title: string;
  steps: string;
  expected_result: string;
}

export interface UserStory {
  id: string;
  title: string;
  role: string;
  goal: string;
  benefit: string;
  status: string; // approved, pending, rejected
  criteria: AcceptanceCriteria[];
  tasks: Task[];
  test_scenarios: TestScenario[];
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  stories: UserStory[];
}

interface AgileDashboardProps {
  epics: Epic[];
  onUpdateStory: (storyId: string, fields: Partial<UserStory>) => Promise<void>;
  onUpdateTask: (taskId: string, fields: Partial<Task>) => Promise<void>;
  onUpdateCriteria: (criteriaId: string, fields: Partial<AcceptanceCriteria>) => Promise<void>;
  onOpenExport: () => void;
  approvedCount: number;
}

export function AgileDashboard({ epics, onUpdateStory, onUpdateTask, onUpdateCriteria, onOpenExport, approvedCount }: AgileDashboardProps) {
  const [expandedEpics, setExpandedEpics] = useState<Record<string, boolean>>(() => {
    // Expand the first epic by default if any exist
    if (epics.length > 0) {
      return { [epics[0].id]: true };
    }
    return {};
  });

  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(() => {
    // Select first story of first epic by default
    if (epics.length > 0 && epics[0].stories.length > 0) {
      return epics[0].stories[0].id;
    }
    return null;
  });

  // Edit states
  const [editingStory, setEditingStory] = useState(false);
  const [editedStoryData, setEditedStoryData] = useState<Partial<UserStory>>({});

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTaskData, setEditedTaskData] = useState<Partial<Task>>({});

  const [editingCriteriaId, setEditingCriteriaId] = useState<string | null>(null);
  const [editedCriteriaData, setEditedCriteriaData] = useState<Partial<AcceptanceCriteria>>({});

  // Helper to find selected story
  let selectedStory: UserStory | null = null;
  for (const epic of epics) {
    const story = epic.stories.find(s => s.id === selectedStoryId);
    if (story) {
      selectedStory = story;
      break;
    }
  }

  const toggleEpic = (epicId: string) => {
    setExpandedEpics(prev => ({
      ...prev,
      [epicId]: !prev[epicId]
    }));
  };

  // Story edits
  const startEditingStory = () => {
    if (!selectedStory) return;
    setEditingStory(true);
    setEditedStoryData({
      title: selectedStory.title,
      role: selectedStory.role,
      goal: selectedStory.goal,
      benefit: selectedStory.benefit
    });
  };

  const saveStoryEdits = async () => {
    if (!selectedStoryId) return;
    await onUpdateStory(selectedStoryId, editedStoryData);
    setEditingStory(false);
  };

  const toggleStoryStatus = async (status: string) => {
    if (!selectedStoryId) return;
    await onUpdateStory(selectedStoryId, { status });
  };

  // Task edits
  const startEditingTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditedTaskData({
      title: task.title,
      priority: task.priority,
      description: task.description
    });
  };

  const saveTaskEdits = async (taskId: string) => {
    await onUpdateTask(taskId, editedTaskData);
    setEditingTaskId(null);
  };

  // Criteria edits
  const startEditingCriteria = (crit: AcceptanceCriteria) => {
    setEditingCriteriaId(crit.id);
    setEditedCriteriaData({
      scenario: crit.scenario,
      given_text: crit.given_text,
      when_text: crit.when_text,
      then_text: crit.then_text
    });
  };

  const saveCriteriaEdits = async (critId: string) => {
    await onUpdateCriteria(critId, editedCriteriaData);
    setEditingCriteriaId(null);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Action Header bar */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Agile Board Backlog Workspace</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Review epics, edit story statements, tasks, and criteria. Approve stories to mark them for backlog export.
          </p>
        </div>
        <div className="flex items-center space-x-3 self-end sm:self-auto">
          <button
            onClick={onOpenExport}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-xl text-xs shadow-md transition"
          >
            <GitBranch className="h-4 w-4" />
            <span>Export to GitHub ({approvedCount})</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT PANEL: Epics & Stories (4 Cols) */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-300 shadow-md p-5 space-y-4">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center space-x-2">
          <Layers className="h-5 w-5 text-indigo-600" />
          <span>Epics & Features</span>
        </h3>

        <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
          {epics.map(epic => (
            <div key={epic.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {/* Epic header */}
              <button
                onClick={() => toggleEpic(epic.id)}
                className="w-full bg-slate-50 px-4 py-3 flex items-center justify-between text-left border-b border-slate-200 hover:bg-slate-100 transition"
              >
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{epic.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{epic.description}</p>
                </div>
                {expandedEpics[epic.id] ? (
                  <ChevronDown className="h-4 w-4 text-slate-600 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-600 flex-shrink-0" />
                )}
              </button>

              {/* Stories list */}
              {expandedEpics[epic.id] && (
                <div className="p-2 space-y-1 bg-white">
                  {epic.stories.length === 0 ? (
                    <p className="text-xs text-slate-500 p-3 italic">No user stories generated.</p>
                  ) : (
                    epic.stories.map(story => (
                      <button
                        key={story.id}
                        onClick={() => {
                          setSelectedStoryId(story.id);
                          setEditingStory(false);
                          setEditingTaskId(null);
                          setEditingCriteriaId(null);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition text-xs font-semibold ${
                          selectedStoryId === story.id
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <span className="truncate pr-2">{story.title}</span>
                        <span
                          className={`text-[9px] uppercase px-2 py-0.5 rounded-full border flex-shrink-0 ${
                            story.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : story.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {story.status}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CENTER PANEL: Details (5 Cols) */}
      <div className="lg:col-span-5 space-y-6">
        {selectedStory ? (
          <>
            {/* Story Details Card */}
            <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 space-y-5">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                    User Story Details
                  </span>
                  {editingStory ? (
                    <input
                      type="text"
                      value={editedStoryData.title || ''}
                      onChange={e => setEditedStoryData(prev => ({ ...prev, title: e.target.value }))}
                      className="text-lg font-bold text-slate-800 mt-3 border border-slate-300 rounded-lg px-3 py-1.5 w-full focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    />
                  ) : (
                    <h3 className="text-lg font-bold text-slate-900 mt-3">{selectedStory.title}</h3>
                  )}
                </div>
                {!editingStory && (
                  <button
                    onClick={startEditingStory}
                    className="flex items-center space-x-1 text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {/* Story Statement (As a / I want / So that) */}
              <div className="space-y-4">
                {editingStory ? (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">As a...</label>
                      <input
                        type="text"
                        value={editedStoryData.role || ''}
                        onChange={e => setEditedStoryData(prev => ({ ...prev, role: e.target.value }))}
                        className="text-sm bg-white border border-slate-300 rounded-lg px-3 py-1.5 w-full focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">I want to...</label>
                      <textarea
                        value={editedStoryData.goal || ''}
                        onChange={e => setEditedStoryData(prev => ({ ...prev, goal: e.target.value }))}
                        className="text-sm bg-white border border-slate-300 rounded-lg px-3 py-1.5 w-full h-16 focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">So that...</label>
                      <textarea
                        value={editedStoryData.benefit || ''}
                        onChange={e => setEditedStoryData(prev => ({ ...prev, benefit: e.target.value }))}
                        className="text-sm bg-white border border-slate-300 rounded-lg px-3 py-1.5 w-full h-16 focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        onClick={() => setEditingStory(false)}
                        className="flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 px-3 py-1.5 rounded-lg bg-white"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={saveStoryEdits}
                        className="flex items-center space-x-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-lg shadow-sm"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 font-medium text-sm text-slate-800 leading-relaxed">
                    <p><span className="text-indigo-600 font-bold uppercase tracking-wider text-[11px] block">As a</span> {selectedStory.role}</p>
                    <p><span className="text-indigo-600 font-bold uppercase tracking-wider text-[11px] block mt-1.5">I want to</span> {selectedStory.goal}</p>
                    <p><span className="text-indigo-600 font-bold uppercase tracking-wider text-[11px] block mt-1.5">So that</span> {selectedStory.benefit}</p>
                  </div>
                )}
              </div>

              {/* Story Approvals */}
              <div className="flex space-x-3 pt-3 border-t border-slate-200 justify-end">
                <button
                  onClick={() => toggleStoryStatus('rejected')}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    selectedStory.status === 'rejected'
                      ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => toggleStoryStatus('approved')}
                  className={`flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                    selectedStory.status === 'approved'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Approve Story</span>
                </button>
              </div>
            </div>

            {/* Acceptance Criteria Section */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="h-4.5 w-4.5 text-indigo-600" />
                <span>Acceptance Criteria (GWT)</span>
              </h3>

              <div className="space-y-3">
                {selectedStory.criteria.map(crit => (
                  <div key={crit.id} className="bg-white rounded-xl border border-slate-300 shadow-sm p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      {editingCriteriaId === crit.id ? (
                        <input
                          type="text"
                          value={editedCriteriaData.scenario || ''}
                          onChange={e => setEditedCriteriaData(prev => ({ ...prev, scenario: e.target.value }))}
                          className="font-bold text-slate-800 text-xs border border-slate-300 rounded px-2 py-1 w-full mr-4"
                        />
                      ) : (
                        <h4 className="font-bold text-slate-800 text-xs truncate uppercase tracking-wider">{crit.scenario}</h4>
                      )}

                      {editingCriteriaId === crit.id ? (
                        <div className="flex space-x-1 flex-shrink-0">
                          <button
                            onClick={() => setEditingCriteriaId(null)}
                            className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => saveCriteriaEdits(crit.id)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditingCriteria(crit)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {editingCriteriaId === crit.id ? (
                      <div className="space-y-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">GIVEN</label>
                          <input
                            type="text"
                            value={editedCriteriaData.given_text || ''}
                            onChange={e => setEditedCriteriaData(prev => ({ ...prev, given_text: e.target.value }))}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">WHEN</label>
                          <input
                            type="text"
                            value={editedCriteriaData.when_text || ''}
                            onChange={e => setEditedCriteriaData(prev => ({ ...prev, when_text: e.target.value }))}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">THEN</label>
                          <input
                            type="text"
                            value={editedCriteriaData.then_text || ''}
                            onChange={e => setEditedCriteriaData(prev => ({ ...prev, then_text: e.target.value }))}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs space-y-1.5 text-slate-600 font-medium">
                        <p><span className="font-bold text-indigo-600 uppercase tracking-wider mr-1 text-[10px]">Given</span> {crit.given_text}</p>
                        <p><span className="font-bold text-indigo-600 uppercase tracking-wider mr-1 text-[10px]">When</span> {crit.when_text}</p>
                        <p><span className="font-bold text-indigo-600 uppercase tracking-wider mr-1 text-[10px]">Then</span> {crit.then_text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Test Scenarios Section */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FlaskConical className="h-4.5 w-4.5 text-indigo-600" />
                <span>Test Scenarios & Edge Cases</span>
              </h3>

              <div className="space-y-3">
                {selectedStory.test_scenarios.map(tst => (
                  <div key={tst.id} className="bg-white rounded-xl border border-slate-300 shadow-sm p-4 space-y-3">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1.5">{tst.title}</h4>
                    <div className="text-xs space-y-2 text-slate-600">
                      <div>
                        <span className="font-bold text-slate-800 block mb-0.5">Steps:</span>
                        <p className="whitespace-pre-line leading-relaxed pl-2 border-l-2 border-slate-200 bg-slate-50/50 py-1">{tst.steps}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block mb-0.5">Expected Result:</span>
                        <p className="leading-relaxed pl-2 border-l-2 border-slate-200 bg-slate-50/50 py-1">{tst.expected_result}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-300 p-8 text-center text-slate-600 font-semibold shadow-md">
            Select a User Story from the left panel to review.
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Suggested Tasks (3 Cols) */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-300 shadow-md p-5 space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center space-x-2">
          <CheckSquare className="h-5 w-5 text-indigo-600" />
          <span>Development Tasks</span>
        </h3>

        {selectedStory ? (
          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
            {selectedStory.tasks.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3">No tasks generated for this story.</p>
            ) : (
              selectedStory.tasks.map(task => (
                <div key={task.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm hover:shadow transition">
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        task.priority === 'High'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : task.priority === 'Medium'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}
                    >
                      {editingTaskId === task.id ? (
                        <select
                          value={editedTaskData.priority || ''}
                          onChange={e => setEditedTaskData(prev => ({ ...prev, priority: e.target.value }))}
                          className="bg-white border border-slate-300 rounded font-semibold text-slate-700"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      ) : (
                        task.priority
                      )}
                    </span>

                    {editingTaskId === task.id ? (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setEditingTaskId(null)}
                          className="p-0.5 text-slate-600 hover:bg-slate-200 rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => saveTaskEdits(task.id)}
                          className="p-0.5 text-indigo-600 hover:bg-indigo-100 rounded"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditingTask(task)}
                        className="p-0.5 text-slate-400 hover:text-indigo-600 rounded transition"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div>
                    {editingTaskId === task.id ? (
                      <input
                        type="text"
                        value={editedTaskData.title || ''}
                        onChange={e => setEditedTaskData(prev => ({ ...prev, title: e.target.value }))}
                        className="text-xs font-bold text-slate-800 border border-slate-300 rounded px-2 py-1 w-full focus:ring-1 focus:ring-indigo-600"
                      />
                    ) : (
                      <h4 className="text-xs font-bold text-slate-800 leading-snug">{task.title}</h4>
                    )}

                    {editingTaskId === task.id ? (
                      <textarea
                        value={editedTaskData.description || ''}
                        onChange={e => setEditedTaskData(prev => ({ ...prev, description: e.target.value }))}
                        className="text-[11px] text-slate-600 mt-2 border border-slate-300 rounded px-2 py-1 w-full h-16 focus:ring-1 focus:ring-indigo-600"
                      />
                    ) : (
                      <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">{task.description}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic p-3 text-center">Select a User Story to view tasks.</p>
        )}
      </div>
    </div>
  </div>
  );
}
