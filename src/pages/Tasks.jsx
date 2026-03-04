import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import "../styles/Tasks.css";

// --- Small reusable factories for consistent "models" ---
const createTaskModel = (data = {}) => ({
  id: data.id || uuidv4(),
  name: data.name || 'Untitled Task',
  priority: data.priority || 'Medium',
  deadline: data.deadline || '',
  category: data.category || 'General',
  tags: Array.isArray(data.tags) ? data.tags : (typeof data.tags === 'string' && data.tags ? data.tags.split(',').map(s => s.trim()) : []),
  recurrence: data.recurrence || '',
  collaborators: Array.isArray(data.collaborators) ? data.collaborators : (typeof data.collaborators === 'string' && data.collaborators ? data.collaborators.split(',').map(s => s.trim()) : []),
  attachments: Array.isArray(data.attachments) ? data.attachments : [],
  subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
  completed: !!data.completed,
  createdAt: data.createdAt || new Date().toISOString(),
  history: Array.isArray(data.history) ? data.history : (data.history ? [data.history] : [`Task created on ${new Date().toLocaleString()}`]),
  timeSpent: typeof data.timeSpent === 'number' ? data.timeSpent : 0,
  reminder: data.reminder || '',
  notes: data.notes || '',
  favorite: !!data.favorite,
  dependencies: Array.isArray(data.dependencies) ? data.dependencies : [],
  comments: Array.isArray(data.comments) ? data.comments : [],
});

const createContractModel = (data = {}) => ({
  id: data.id || uuidv4(),
  title: data.title || 'Untitled Contract',
  content: data.content || '',
  createdAt: data.createdAt || new Date().toISOString(),
  signed: !!data.signed,
  history: Array.isArray(data.history) ? data.history : (data.history ? [data.history] : [`Contract created on ${new Date().toLocaleString()}`])
});

const createReportModel = (data = {}) => ({
  id: data.id || uuidv4(),
  title: data.title || 'Untitled Report',
  content: data.content || '',
  createdAt: data.createdAt || new Date().toISOString()
});

// ----------------------------
// Small reusable modal components (no styles here; you asked to keep CSS external)
// ----------------------------
const ModalShell = ({ show, title, children, onClose }) => {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
        <div className="modal-actions">
          <button className="btn-gray" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const EditTaskModal = ({ show, task, onClose, onSave }) => {
  const [edited, setEdited] = useState(createTaskModel(task || {}));

  useEffect(() => setEdited(createTaskModel(task || {})), [task]);

  if (!show) return null;

  const change = (e) => {
    const { name, value } = e.target;
    setEdited(prev => ({ ...prev, [name]: value }));
  };

  const save = () => {
    // normalize tags/collaborators
    const normalized = {
      ...edited,
      tags: typeof edited.tags === 'string' ? edited.tags.split(',').map(s => s.trim()) : edited.tags,
      collaborators: typeof edited.collaborators === 'string' ? edited.collaborators.split(',').map(s => s.trim()) : edited.collaborators,
    };
    onSave(normalized);
  };

  return (
    <ModalShell show={show} title="Edit Task" onClose={onClose}>
      <label>
        Name
        <input name="name" value={edited.name} onChange={change} />
      </label>
      <label>
        Priority
        <select name="priority" value={edited.priority} onChange={change}>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </label>
      <label>
        Deadline
        <input name="deadline" type="date" value={edited.deadline} onChange={change} />
      </label>
      <label>
        Category
        <select name="category" value={edited.category} onChange={change}>
          <option>General</option>
          <option>Work</option>
          <option>Personal</option>
          <option>Urgent</option>
        </select>
      </label>
      <label>
        Tags (comma separated)
        <input name="tags" value={Array.isArray(edited.tags) ? edited.tags.join(', ') : edited.tags} onChange={(e) => setEdited(prev => ({ ...prev, tags: e.target.value }))} />
      </label>
      <label>
        Recurrence
        <input name="recurrence" value={edited.recurrence} onChange={change} placeholder="Daily / Weekly / Monthly" />
      </label>
      <label>
        Collaborators (comma separated)
        <input name="collaborators" value={Array.isArray(edited.collaborators) ? edited.collaborators.join(', ') : edited.collaborators} onChange={(e) => setEdited(prev => ({ ...prev, collaborators: e.target.value }))} />
      </label>
      <div className="modal-actions">
        <button className="btn-blue" onClick={save}>Save</button>
      </div>
    </ModalShell>
  );
};

const SimpleInputModal = ({ show, title, placeholder, initial = '', onClose, onSave }) => {
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial, show]);
  if (!show) return null;
  return (
    <ModalShell show={show} title={title} onClose={onClose}>
      <input value={value} placeholder={placeholder} onChange={(e) => setValue(e.target.value)} />
      <div className="modal-actions">
        <button className="btn-blue" onClick={() => onSave(value)}>Save</button>
      </div>
    </ModalShell>
  );
};

// View modals (contract/report)
const ViewContractModal = ({ show, contract, onClose, onSign, onDownload }) => {
  if (!show || !contract) return null;
  return (
    <ModalShell show={show} title="Contract Details" onClose={onClose}>
      <h4>{contract.title}</h4>
      <p><strong>Created:</strong> {new Date(contract.createdAt).toLocaleString()}</p>
      <p><strong>Status:</strong> {contract.signed ? 'Signed' : 'Pending'}</p>
      <div className="contract-content-preview">{contract.content}</div>
      <h5>History</h5>
      <pre className="contract-history">{(contract.history || []).join('\n')}</pre>
      <div className="modal-actions">
        {!contract.signed && <button className="btn-green" onClick={() => onSign(contract.id)}>Sign</button>}
        <button className="btn-blue" onClick={() => onDownload(contract.id)}>Download</button>
      </div>
    </ModalShell>
  );
};

const ViewReportModal = ({ show, report, onClose, onExportCSV }) => {
  if (!show || !report) return null;
  return (
    <ModalShell show={show} title={`Report: ${report.title}`} onClose={onClose}>
      <pre className="report-details">{report.content}</pre>
      <div className="modal-actions">
        <button className="btn-blue" onClick={() => onExportCSV(report.id)}>Export CSV</button>
      </div>
    </ModalShell>
  );
};

// ----------------------------
// Main Tasks component
// ----------------------------
const Tasks = () => {
  const [activeTab, setActiveTab] = useState('tasks');

  // tasks state
  const [tasks, setTasks] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);

  // form fields
  const [taskName, setTaskName] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskCategory, setTaskCategory] = useState('General');
  const [taskTags, setTaskTags] = useState('');
  const [taskRecurrence, setTaskRecurrence] = useState('');
  const [taskCollaborators, setTaskCollaborators] = useState('');
  const [taskAttachments, setTaskAttachments] = useState([]);

  // filters, search, paging
  const [filter, setFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOption, setSortOption] = useState('None');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 5;
  const [selectedTasks, setSelectedTasks] = useState([]);

  // timers
  const [timerTaskId, setTimerTaskId] = useState(null);
  const [timerStart, setTimerStart] = useState(null);

  // contracts & reports
  const [contracts, setContracts] = useState([]);
  const [contractTitle, setContractTitle] = useState('');
  const [contractContent, setContractContent] = useState('');
  const [contractSearch, setContractSearch] = useState('');
  const [contractFilterSigned, setContractFilterSigned] = useState('All');
  const [reports, setReports] = useState([]);
  const [reportTitle, setReportTitle] = useState('');

  // modals and selection
  const [showEditModal, setShowEditModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const [showAddSubtask, setShowAddSubtask] = useState({ open: false, taskId: null });
  const [showAddComment, setShowAddComment] = useState({ open: false, taskId: null });
  const [showAddDependency, setShowAddDependency] = useState({ open: false, taskId: null });
  const [showAddTime, setShowAddTime] = useState({ open: false, taskId: null });

  const [selectedContractId, setSelectedContractId] = useState(null);
  const [showContractModal, setShowContractModal] = useState(false);

  const [selectedReportId, setSelectedReportId] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // --- persist/load localStorage using normalized models ---
  useEffect(() => {
    try {
      const tRaw = JSON.parse(localStorage.getItem('tasks')) || [];
      setTasks(Array.isArray(tRaw) ? tRaw.map(createTaskModel) : []);

      const aRaw = JSON.parse(localStorage.getItem('archivedTasks')) || [];
      setArchivedTasks(Array.isArray(aRaw) ? aRaw.map(createTaskModel) : []);

      const cRaw = JSON.parse(localStorage.getItem('contracts')) || [];
      setContracts(Array.isArray(cRaw) ? cRaw.map(createContractModel) : []);

      const rRaw = JSON.parse(localStorage.getItem('reports')) || [];
      setReports(Array.isArray(rRaw) ? rRaw.map(createReportModel) : []);
    } catch (err) {
      console.error('parse error', err);
    }
  }, []);

  useEffect(() => localStorage.setItem('tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('archivedTasks', JSON.stringify(archivedTasks)), [archivedTasks]);
  useEffect(() => localStorage.setItem('contracts', JSON.stringify(contracts)), [contracts]);
  useEffect(() => localStorage.setItem('reports', JSON.stringify(reports)), [reports]);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(''), 3000);
    return () => clearTimeout(t);
  }, [notification]);

  // --- tasks actions ---
  const resetTaskForm = () => {
    setTaskName('');
    setTaskPriority('Medium');
    setTaskDeadline('');
    setTaskCategory('General');
    setTaskTags('');
    setTaskRecurrence('');
    setTaskCollaborators('');
    setTaskAttachments([]);
  };

  const addTask = () => {
    if (!taskName.trim()) {
      setNotification('Task name required');
      return;
    }
    const newTask = createTaskModel({
      name: taskName.trim(),
      priority: taskPriority,
      deadline: taskDeadline,
      category: taskCategory,
      tags: taskTags ? taskTags.split(',').map(s => s.trim()) : [],
      recurrence: taskRecurrence,
      collaborators: taskCollaborators ? taskCollaborators.split(',').map(s => s.trim()) : [],
      attachments: taskAttachments,
    });
    setTasks(prev => [...prev, newTask]);
    resetTaskForm();
    setNotification('Task added');
  };

  const toggleTaskCompletion = (taskId) => {
    const newTasks = [];
    const recurring = [];
    tasks.forEach(t => {
      if (t.id === taskId) {
        const updated = { ...t, completed: !t.completed, history: [...(t.history||[]), `Status toggled on ${new Date().toLocaleString()}`] };
        newTasks.push(updated);
        if (updated.completed && (updated.recurrence || '').toLowerCase()) {
          const rec = (updated.recurrence || '').toLowerCase();
          let days = 0;
          if (rec === 'daily') days = 1;
          else if (rec === 'weekly') days = 7;
          else if (rec === 'monthly') days = 30;
          if (days && updated.deadline) {
            const nd = new Date(updated.deadline);
            nd.setDate(nd.getDate() + days);
            recurring.push(createTaskModel({ ...updated, id: uuidv4(), deadline: nd.toISOString().split('T')[0], completed: false, history: [`Recurring created on ${new Date().toLocaleString()}`] }));
          }
        }
      } else newTasks.push(t);
    });
    setTasks([...newTasks, ...recurring]);
    setNotification('Task status updated');
  };

  const openEdit = (task) => { setTaskToEdit(task); setShowEditModal(true); };
  const saveEdit = (edited) => {
    setTasks(prev => prev.map(t => (t.id === edited.id ? createTaskModel({ ...t, ...edited, history: [...(t.history||[]), `Edited on ${new Date().toLocaleString()}`] }) : t)));
    setShowEditModal(false);
    setTaskToEdit(null);
    setNotification('Task updated');
  };

  const duplicateTask = (id) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    const copy = createTaskModel({ ...t, id: uuidv4(), name: `${t.name} (Copy)`, createdAt: new Date().toISOString(), history: [...(t.history||[]), `Duplicated on ${new Date().toLocaleString()}`] });
    setTasks(prev => [...prev, copy]);
    setNotification('Task duplicated');
  };

  const toggleFavorite = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, favorite: !t.favorite, history: [...(t.history||[]), `Favorite toggled on ${new Date().toLocaleString()}`] } : t));
    setNotification('Favorite toggled');
  };

  const startTimer = (id) => {
    if (timerTaskId) { setNotification('Stop active timer first'); return; }
    setTimerTaskId(id); setTimerStart(Date.now()); setNotification('Timer started');
  };
  const stopTimer = (id) => {
    if (timerTaskId !== id) return;
    const elapsed = Math.floor((Date.now() - timerStart) / 60000);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, timeSpent: (t.timeSpent||0) + elapsed, history: [...(t.history||[]), `Timer added ${elapsed} min on ${new Date().toLocaleString()}`] } : t));
    setTimerTaskId(null); setTimerStart(null); setNotification(`Logged ${elapsed} minutes`);
  };

  // replace prompt-based functions with modals
  const openAddSubtaskModal = (taskId) => setShowAddSubtask({ open: true, taskId });
  const handleAddSubtask = (value) => {
    if (!value || !value.trim()) { setShowAddSubtask({ open: false, taskId: null }); return; }
    const name = value.trim();
    setTasks(prev => prev.map(t => t.id === showAddSubtask.taskId ? { ...t, subtasks: [...(t.subtasks||[]), { name, completed: false }], history: [...(t.history||[]), `Subtask '${name}' added on ${new Date().toLocaleString()}`] } : t));
    setShowAddSubtask({ open: false, taskId: null });
    setNotification('Subtask added');
  };

  const openAddCommentModal = (taskId) => setShowAddComment({ open: true, taskId });
  const handleAddComment = (value) => {
    if (!value || !value.trim()) { setShowAddComment({ open: false, taskId: null }); return; }
    const comment = value.trim();
    setTasks(prev => prev.map(t => t.id === showAddComment.taskId ? { ...t, comments: [...(t.comments||[]), comment], history: [...(t.history||[]), `Comment added on ${new Date().toLocaleString()}`] } : t));
    setShowAddComment({ open: false, taskId: null });
    setNotification('Comment added');
  };

  const openAddDependencyModal = (taskId) => setShowAddDependency({ open: true, taskId });
  const handleAddDependency = (value) => {
    if (!value) { setShowAddDependency({ open: false, taskId: null }); return; }
    const ids = value.split(',').map(s => s.trim()).filter(Boolean);
    setTasks(prev => prev.map(t => t.id === showAddDependency.taskId ? { ...t, dependencies: [...(t.dependencies||[]), ...ids], history: [...(t.history||[]), `Dependencies added on ${new Date().toLocaleString()}`] } : t));
    setShowAddDependency({ open: false, taskId: null });
    setNotification('Dependencies added');
  };

  const openAddTimeModal = (taskId) => setShowAddTime({ open: true, taskId });
  const handleAddTime = (value) => {
    const minutes = parseInt(value, 10);
    if (isNaN(minutes) || minutes <= 0) { setShowAddTime({ open: false, taskId: null }); return; }
    setTasks(prev => prev.map(t => t.id === showAddTime.taskId ? { ...t, timeSpent: (t.timeSpent||0) + minutes, history: [...(t.history||[]), `Added ${minutes} minutes on ${new Date().toLocaleString()}`] } : t));
    setShowAddTime({ open: false, taskId: null });
    setNotification('Time added');
  };

  const toggleSubtaskCompletion = (taskId, idx) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks: (t.subtasks||[]).map((s,i)=> i===idx ? { ...s, completed: !s.completed } : s), history: [...(t.history||[]), `Subtask toggled on ${new Date().toLocaleString()}`] } : t));
    setNotification('Subtask updated');
  };

  const addDependency = (taskId) => openAddDependencyModal(taskId);
  const addComment = (taskId) => openAddCommentModal(taskId);
  const addSubtask = (taskId) => openAddSubtaskModal(taskId);
  const addTimeSpent = (taskId) => openAddTimeModal(taskId);

  const archiveTask = (taskId) => {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    setTasks(prev => prev.filter(x => x.id !== taskId));
    setArchivedTasks(prev => [...prev, t]);
    setNotification('Task archived');
  };
  const restoreTask = (taskId) => {
    const t = archivedTasks.find(x => x.id === taskId);
    if (!t) return;
    setArchivedTasks(prev => prev.filter(x => x.id !== taskId));
    setTasks(prev => [...prev, t]);
    setNotification('Task restored');
  };

  const removeTask = (taskId) => { setTasks(prev => prev.filter(t => t.id !== taskId)); setNotification('Task removed'); };
  const bulkRemoveTasks = () => { if (!selectedTasks.length) return setNotification('No tasks selected'); setTasks(prev => prev.filter(t => !selectedTasks.includes(t.id))); setSelectedTasks([]); setNotification('Selected removed'); };
  const bulkCompleteTasks = () => { if (!selectedTasks.length) return setNotification('No tasks selected'); setTasks(prev => prev.map(t => selectedTasks.includes(t.id) ? { ...t, completed: true, history: [...(t.history||[]), `Marked complete on ${new Date().toLocaleString()}`] } : t)); setSelectedTasks([]); setNotification('Marked complete'); };

  const toggleSelectTask = (taskId) => setSelectedTasks(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]);

  const clearCompletedTasks = () => { setTasks(prev => prev.filter(t => !t.completed)); setNotification('Completed cleared'); };
  const clearAllTasks = () => { setTasks([]); setNotification('All cleared'); };

  const uploadAttachments = (files) => { const arr = Array.from(files||[]).map(f => f.name); setTaskAttachments(prev => [...prev, ...arr]); setNotification('Attachments uploaded'); };

  // sorting & filtering
  const sortTasks = (list) => {
    const copy = [...list];
    if (sortOption === 'Deadline') copy.sort((a,b)=> { const da = a.deadline ? new Date(a.deadline).getTime() : Infinity; const db = b.deadline ? new Date(b.deadline).getTime() : Infinity; return da-db; });
    if (sortOption === 'Priority') { const order = { High:1, Medium:2, Low:3 }; copy.sort((a,b) => (order[a.priority]||99)-(order[b.priority]||99)); }
    if (sortOption === 'TimeSpent') copy.sort((a,b) => (b.timeSpent||0)-(a.timeSpent||0));
    return copy;
  };

  const filteredTasks = sortTasks(tasks.filter(t => {
    const matchesFilter = filter === 'All' ? true : (filter === 'Completed' ? t.completed : !t.completed);
    const matchesSearch = (t.name||'').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
    return matchesFilter && matchesSearch && matchesCategory;
  }));

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / tasksPerPage));
  const currentTasks = filteredTasks.slice((currentPage-1)*tasksPerPage, currentPage*tasksPerPage);
  const progress = tasks.length ? Math.round((tasks.filter(t=>t.completed).length/tasks.length)*100) : 0;

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const copy = Array.from(tasks);
    const [moved] = copy.splice(result.source.index, 1);
    copy.splice(result.destination.index, 0, moved);
    setTasks(copy);
  };

  const isOverdue = (deadline, completed) => { if (!deadline) return false; const today = new Date().setHours(0,0,0,0); const d = new Date(deadline).setHours(0,0,0,0); return !completed && d < today; };

  // Contracts
  const addContract = () => {
    if (!contractTitle.trim() || !contractContent.trim()) { setNotification('Contract fields required'); return; }
    const c = createContractModel({ title: contractTitle.trim(), content: contractContent.trim() });
    setContracts(prev => [...prev, c]); setContractTitle(''); setContractContent(''); setNotification('Contract created');
  };
  const handleSignContract = (id) => { setContracts(prev => prev.map(c => c.id === id ? { ...c, signed: true, history: [...(c.history||[]), `Signed on ${new Date().toLocaleString()}`] } : c)); setNotification('Contract signed'); };
  const handleDownloadContract = (id) => { const c = contracts.find(x=>x.id===id); if (!c) return; const blob = new Blob([`Title: ${c.title}\n\n${c.content}`], { type: 'text/plain;charset=utf-8' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${c.title.replace(/\s+/g,'_')}.txt`; link.click(); setNotification('Contract downloaded'); };

  const filteredContracts = contracts.filter(c => (c.title||'').toLowerCase().includes(contractSearch.toLowerCase()) && (contractFilterSigned === 'All' ? true : (contractFilterSigned === 'Signed' ? c.signed : !c.signed)));

  // Reports
  const generateReport = () => {
    if (!reportTitle.trim()) { setNotification('Report title required'); return; }
    const byCategory = tasks.reduce((acc,t)=>{ const cat=t.category||'General'; acc[cat]=(acc[cat]||0)+1; return acc; }, {});
    const lines = Object.entries(byCategory).map(([k,v]) => `${k}: ${v} task(s)`);
    lines.push(`Total Time Spent: ${tasks.reduce((s,t)=>s+(t.timeSpent||0),0)} minutes`);
    const r = createReportModel({ title: reportTitle.trim(), content: lines.join('\n') });
    setReports(prev=>[...prev,r]); setReportTitle(''); setNotification('Report generated');
  };

  const handleExportReportCSV = (id) => {
    const r = reports.find(x=>x.id===id); if (!r) return; const csv = r.content.split('\n').map(line => `"${line.replace(/"/g,'""')}"`).join('\n'); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${r.title.replace(/\s+/g,'_')}_report.csv`; link.click(); setNotification('Report exported'); };

  // Export tasks to excel
  const exportTasksToExcel = () => { const ws = XLSX.utils.json_to_sheet(tasks); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Tasks'); XLSX.writeFile(wb, 'tasks.xlsx'); setNotification('Exported to Excel'); };

  return (
    <div className="tasks-container">
      <h2 className="tasks-heading">Task & Contract Manager</h2>
      {notification && <p className="notification">{notification}</p>}

      <div className="tasks-tabs">
        <button className={`tab-button ${activeTab==='tasks'?'active':''}`} onClick={()=>setActiveTab('tasks')}>Tasks</button>
        <button className={`tab-button ${activeTab==='contracts'?'active':''}`} onClick={()=>setActiveTab('contracts')}>Contracts</button>
        <button className={`tab-button ${activeTab==='reports'?'active':''}`} onClick={()=>setActiveTab('reports')}>Reports</button>
      </div>

      {activeTab === 'tasks' && (
        <>
          <div className="tasks-input">
            <input value={taskName} onChange={(e)=>setTaskName(e.target.value)} placeholder="Task name..." />
            <select value={taskPriority} onChange={(e)=>setTaskPriority(e.target.value)}>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <input type="date" value={taskDeadline} onChange={(e)=>setTaskDeadline(e.target.value)} />
            <select value={taskCategory} onChange={(e)=>setTaskCategory(e.target.value)}>
              <option>General</option>
              <option>Work</option>
              <option>Personal</option>
              <option>Urgent</option>
            </select>
            <input value={taskTags} onChange={(e)=>setTaskTags(e.target.value)} placeholder="Tags (comma separated)" />
            <input value={taskRecurrence} onChange={(e)=>setTaskRecurrence(e.target.value)} placeholder="Recurrence (Daily/Weekly/Monthly)" />
            <input value={taskCollaborators} onChange={(e)=>setTaskCollaborators(e.target.value)} placeholder="Collaborators (comma separated)" />
            <label className="file-upload-wrapper">
              <span className="file-upload-button">Attachments</span>
              <input type="file" multiple onChange={(e)=>uploadAttachments(e.target.files)} />
            </label>
            <button className="task-add-button" onClick={addTask}>Add Task</button>
          </div>

          <div className="task-filter">
            <input placeholder="Search tasks..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} />
            <select value={filter} onChange={(e)=>setFilter(e.target.value)}>
              <option>All</option>
              <option>Completed</option>
              <option>Pending</option>
            </select>
            <select value={categoryFilter} onChange={(e)=>setCategoryFilter(e.target.value)}>
              <option>All</option>
              <option>General</option>
              <option>Work</option>
              <option>Personal</option>
              <option>Urgent</option>
            </select>
            <select value={sortOption} onChange={(e)=>setSortOption(e.target.value)}>
              <option value="None">No Sort</option>
              <option value="Deadline">By Deadline</option>
              <option value="Priority">By Priority</option>
              <option value="TimeSpent">By Time Spent</option>
            </select>
          </div>

          <div className="bulk-actions">
            <button onClick={bulkCompleteTasks}>Complete Selected</button>
            <button onClick={bulkRemoveTasks}>Remove Selected</button>
            <button onClick={()=>setSelectedTasks([])}>Clear Selection</button>
          </div>

          <div className="task-summary">
            <p><strong>{filteredTasks.length}</strong> tasks</p>
            <p><strong>Progress:</strong> {progress}%</p>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="tasks-list">
              {(provided)=>(
                <ul className="tasks-list" ref={provided.innerRef} {...provided.droppableProps}>
                  {currentTasks.map((task, idx)=> (
                    <Draggable key={task.id} draggableId={task.id} index={idx}>
                      {(prov)=>(
                        <li ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} className={`task-item ${isOverdue(task.deadline, task.completed)?'overdue':''}`}>
                          <input type="checkbox" checked={selectedTasks.includes(task.id)} onChange={()=>toggleSelectTask(task.id)} />
                          <div className="task-details">
                            <h3 onDoubleClick={()=>openEdit(task)}>{task.name} {task.favorite && '★'}</h3>
                            <p><strong>Priority:</strong> {task.priority}</p>
                            <p><strong>Deadline:</strong> {task.deadline || 'N/A'}</p>
                            <p><strong>Category:</strong> {task.category}</p>
                            <p><strong>Time Spent:</strong> {task.timeSpent || 0} mins</p>
                            {(task.tags||[]).length>0 && <p><strong>Tags:</strong> {(task.tags||[]).join(', ')}</p>}
                            {(task.subtasks||[]).length>0 && <p><strong>Subtasks:</strong> {(task.subtasks||[]).filter(s=>s.completed).length}/{(task.subtasks||[]).length}</p>}

                            <div className="task-action-row">
                              {timerTaskId===task.id ? <button onClick={()=>stopTimer(task.id)}>Stop Timer</button> : <button onClick={()=>startTimer(task.id)}>Start Timer</button>}
                              <button onClick={()=>toggleFavorite(task.id)}>{task.favorite? 'Unfavorite' : 'Favorite'}</button>
                              <button onClick={()=>toggleTaskCompletion(task.id)}>{task.completed? 'Mark Incomplete' : 'Mark Complete'}</button>
                              <button onClick={()=>openEdit(task)}>Edit</button>
                              <button onClick={()=>duplicateTask(task.id)}>Duplicate</button>
                              <button onClick={()=>openAddTimeModal(task.id)}>+Time</button>
                              <button onClick={()=>openAddSubtaskModal(task.id)}>+Subtask</button>
                              <button onClick={()=>openAddCommentModal(task.id)}>+Comment</button>
                              <button onClick={()=>openAddDependencyModal(task.id)}>+Dependency</button>
                              <button onClick={()=>archiveTask(task.id)}>Archive</button>
                              <button className="btn-red" onClick={()=>removeTask(task.id)}>Delete</button>
                            </div>

                            {(task.subtasks||[]).map((s, i)=> (
                              <div key={i} className="subtask-row">
                                <input type="checkbox" checked={!!s.completed} onChange={()=>toggleSubtaskCompletion(task.id, i)} />
                                <span className={s.completed? 'subtask-completed':''}>{s.name}</span>
                              </div>
                            ))}

                          </div>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>

          <div className="pagination">
            {currentPage>1 && <button onClick={()=>setCurrentPage(p=>p-1)}>Previous</button>}
            {currentPage<totalPages && <button onClick={()=>setCurrentPage(p=>p+1)}>Next</button>}
          </div>

          <div className="tasks-actions">
            <button onClick={exportTasksToExcel}>Export Tasks to Excel</button>
            <button onClick={clearCompletedTasks}>Clear Completed</button>
            <button onClick={clearAllTasks}>Clear All</button>
          </div>

          {archivedTasks.length>0 && (
            <div className="archived-tasks">
              <h3>Archived</h3>
              <ul>
                {archivedTasks.map(a=> (
                  <li key={a.id}>{a.name} <button onClick={()=>restoreTask(a.id)}>Restore</button></li>
                ))}
              </ul>
            </div>
          )}

        </>
      )}

      {activeTab==='contracts' && (
        <>
          <div className="contracts-header">
            <h2>Contract Management</h2>
            <div className="contract-actions">
              <input placeholder="Search contracts..." value={contractSearch} onChange={(e)=>setContractSearch(e.target.value)} />
              <select value={contractFilterSigned} onChange={(e)=>setContractFilterSigned(e.target.value)}>
                <option>All</option>
                <option>Signed</option>
                <option>Pending</option>
              </select>
            </div>
          </div>
          <div className="contract-form">
            <input value={contractTitle} onChange={(e)=>setContractTitle(e.target.value)} placeholder="Contract Title..." />
            <textarea value={contractContent} onChange={(e)=>setContractContent(e.target.value)} placeholder="Contract Content..." />
            <button onClick={addContract}>Create Contract</button>
          </div>

          <div className="contracts-list">
            {filteredContracts.length>0 ? (
              <ul>
                {filteredContracts.map(c=> (
                  <li key={c.id} className="contract-item">
                    <div className="contract-info">
                      <h3>{c.title}</h3>
                      <p><strong>Created:</strong> {new Date(c.createdAt).toLocaleString()}</p>
                      <p><strong>Status:</strong> {c.signed? 'Signed':'Pending'}</p>
                    </div>
                    <div className="contract-buttons">
                      <button onClick={()=>{ setSelectedContractId(c.id); setShowContractModal(true); }}>View</button>
                      {!c.signed && <button onClick={()=>handleSignContract(c.id)}>Sign</button>}
                      <button onClick={()=>handleDownloadContract(c.id)}>Download</button>
                      <button onClick={()=>setContracts(prev=>prev.filter(x=>x.id!==c.id))}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="no-data">No contracts</p>}
          </div>
        </>
      )}

      {activeTab==='reports' && (
        <>
          <div className="reports-header"><h2>Reports & Analytics</h2></div>
          <div className="report-form">
            <input value={reportTitle} onChange={(e)=>setReportTitle(e.target.value)} placeholder="Report Title..." />
            <button onClick={generateReport}>Generate Report</button>
          </div>
          <div className="reports-list">
            {reports.length>0 ? (
              <ul>
                {reports.map(r=> (
                  <li key={r.id} className="report-item">
                    <div className="report-info">
                      <h3>{r.title}</h3>
                      <p><strong>Created:</strong> {new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="report-buttons">
                      <button onClick={()=>{ setSelectedReportId(r.id); setShowReportModal(true); }}>View</button>
                      <button onClick={()=>handleExportReportCSV(r.id)}>Export CSV</button>
                      <button onClick={()=>setReports(prev=>prev.filter(x=>x.id!==r.id))}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="no-data">No reports</p>}
          </div>
        </>
      )}

      {/* modals */}
      <EditTaskModal show={showEditModal} task={taskToEdit} onClose={()=>{setShowEditModal(false); setTaskToEdit(null);}} onSave={saveEdit} />

      <SimpleInputModal show={showAddSubtask.open} title="Add Subtask" placeholder="Subtask name" initial="" onClose={()=>setShowAddSubtask({open:false, taskId:null})} onSave={handleAddSubtask} />
      <SimpleInputModal show={showAddComment.open} title="Add Comment" placeholder="Comment" initial="" onClose={()=>setShowAddComment({open:false, taskId:null})} onSave={handleAddComment} />
      <SimpleInputModal show={showAddDependency.open} title="Add Dependencies (comma separated IDs)" placeholder="id1, id2" initial="" onClose={()=>setShowAddDependency({open:false, taskId:null})} onSave={handleAddDependency} />
      <SimpleInputModal show={showAddTime.open} title="Add Time (minutes)" placeholder="Minutes" initial="" onClose={()=>setShowAddTime({open:false, taskId:null})} onSave={handleAddTime} />

      {showContractModal && <ViewContractModal show={showContractModal} contract={contracts.find(c=>c.id===selectedContractId)} onClose={()=>setShowContractModal(false)} onSign={handleSignContract} onDownload={handleDownloadContract} />}

      {showReportModal && <ViewReportModal show={showReportModal} report={reports.find(r=>r.id===selectedReportId)} onClose={()=>setShowReportModal(false)} onExportCSV={handleExportReportCSV} />}

    </div>
  );
};

export default Tasks;
