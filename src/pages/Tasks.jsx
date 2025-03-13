import React, { useState, useEffect } from 'react';
import '../styles/Tasks.css';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Modal for editing a task
const EditTaskModal = ({ show, task, onClose, onSave }) => {
  const [editedTask, setEditedTask] = useState({});

  useEffect(() => {
    setEditedTask(task || {});
  }, [task]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedTask(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(editedTask);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Task</h2>
        <label>
          Task Name:
          <input 
            type="text" 
            name="name" 
            value={editedTask.name || ''} 
            onChange={handleChange} 
          />
        </label>
        <label>
          Priority:
          <select name="priority" value={editedTask.priority || 'Medium'} onChange={handleChange}>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </label>
        <label>
          Deadline:
          <input 
            type="date" 
            name="deadline" 
            value={editedTask.deadline || ''} 
            onChange={handleChange} 
          />
        </label>
        <label>
          Category:
          <select name="category" value={editedTask.category || 'General'} onChange={handleChange}>
            <option value="General">General</option>
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Urgent">Urgent</option>
          </select>
        </label>
        <label>
          Tags (comma separated):
          <input 
            type="text" 
            name="tags" 
            value={editedTask.tags ? editedTask.tags.join(', ') : ''} 
            onChange={(e) =>
              setEditedTask(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()) }))
            }
          />
        </label>
        <div className="modal-actions">
          <button onClick={onClose} className="btn-gray">Cancel</button>
          <button onClick={handleSave} className="btn-blue">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

const Tasks = () => {
  // TAB MANAGEMENT: "tasks", "contracts", "reports"
  const [activeTab, setActiveTab] = useState('tasks');

  // TASKS STATE & FIELDS
  const [tasks, setTasks] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [taskName, setTaskName] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskCategory, setTaskCategory] = useState('General');
  const [taskTags, setTaskTags] = useState('');
  const [taskRecurrence, setTaskRecurrence] = useState('');
  const [taskCollaborators, setTaskCollaborators] = useState('');
  const [taskAttachments, setTaskAttachments] = useState([]);
  const [filter, setFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOption, setSortOption] = useState('None');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 5;
  const [selectedTasks, setSelectedTasks] = useState([]);
  // Timer state for tasks
  const [timerTaskId, setTimerTaskId] = useState(null);
  const [timerStart, setTimerStart] = useState(null);

  // CONTRACT MANAGEMENT STATE
  const [contracts, setContracts] = useState([]);
  const [contractTitle, setContractTitle] = useState('');
  const [contractContent, setContractContent] = useState('');
  // Selected contract for viewing details
  const [selectedContract, setSelectedContract] = useState(null);

  // For editing tasks via modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    setTasks(savedTasks);
    const savedArchived = JSON.parse(localStorage.getItem('archivedTasks')) || [];
    setArchivedTasks(savedArchived);
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('archivedTasks', JSON.stringify(archivedTasks));
  }, [archivedTasks]);

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // EXPORT TASKS TO EXCEL
  const exportTasksToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(tasks);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
    XLSX.writeFile(wb, 'tasks.xlsx');
    setNotification('Tasks exported to Excel!');
  };

  // ---------------------------
  // TASKS FUNCTIONS
  // ---------------------------
  const addTask = () => {
    if (!taskName.trim()) {
      alert('Task name cannot be empty.');
      return;
    }
    const newTask = {
      id: uuidv4(),
      name: taskName.trim(),
      priority: taskPriority,
      deadline: taskDeadline,
      category: taskCategory,
      tags: taskTags.split(',').map(tag => tag.trim()),
      recurrence: taskRecurrence,
      collaborators: taskCollaborators.split(',').map(collab => collab.trim()),
      attachments: taskAttachments,
      subtasks: [],
      completed: false,
      createdAt: new Date().toISOString(),
      history: [`Task created on ${new Date().toLocaleString()}`],
      timeSpent: 0,
      reminder: '',
      notes: '',
      favorite: false,
      dependencies: [],
      comments: [],
    };
    setTasks([...tasks, newTask]);
    resetForm();
    setNotification('Task added successfully!');
  };

  const resetForm = () => {
    setTaskName('');
    setTaskPriority('Medium');
    setTaskDeadline('');
    setTaskCategory('General');
    setTaskTags('');
    setTaskRecurrence('');
    setTaskCollaborators('');
    setTaskAttachments([]);
  };

  const toggleTaskCompletion = (taskId) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId) {
          const newCompleted = !task.completed;
          let updatedTask = { 
            ...task, 
            completed: newCompleted, 
            history: [...task.history, `Status toggled on ${new Date().toLocaleString()}`] 
          };
          // Auto-reschedule recurring tasks when marked complete
          if (newCompleted && task.recurrence.trim() !== '') {
            let daysToAdd = 0;
            const rec = task.recurrence.toLowerCase();
            if (rec === 'daily') daysToAdd = 1;
            else if (rec === 'weekly') daysToAdd = 7;
            else if (rec === 'monthly') daysToAdd = 30;
            if (daysToAdd && task.deadline) {
              const newDeadline = new Date(task.deadline);
              newDeadline.setDate(newDeadline.getDate() + daysToAdd);
              const recurringTask = {
                ...task,
                id: uuidv4(),
                deadline: newDeadline.toISOString().split('T')[0],
                completed: false,
                history: [`Recurring task generated on ${new Date().toLocaleString()}`],
              };
              setTasks(prev => [...prev, recurringTask]);
              setNotification('Recurring task auto-rescheduled!');
            }
          }
          return updatedTask;
        }
        return task;
      })
    );
    setNotification('Task status updated!');
  };

  const openEditModal = (task) => {
    setTaskToEdit(task);
    setShowEditModal(true);
  };

  const saveEditedTask = (editedTask) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === editedTask.id
          ? { ...editedTask, history: [...task.history, `Task edited on ${new Date().toLocaleString()}`] }
          : task
      )
    );
    setShowEditModal(false);
    setTaskToEdit(null);
    setNotification('Task updated successfully!');
  };

  // New function: Duplicate Task
  const duplicateTask = (taskId) => {
    const taskToDuplicate = tasks.find(task => task.id === taskId);
    if (taskToDuplicate) {
      const duplicatedTask = {
        ...taskToDuplicate,
        id: uuidv4(),
        name: taskToDuplicate.name + " (Copy)",
        createdAt: new Date().toISOString(),
        history: [...taskToDuplicate.history, `Task duplicated on ${new Date().toLocaleString()}`]
      };
      setTasks([...tasks, duplicatedTask]);
      setNotification('Task duplicated successfully!');
    }
  };

  const toggleFavorite = (taskId) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, favorite: !task.favorite, history: [...task.history, `Favorite toggled on ${new Date().toLocaleString()}`] } : task
      )
    );
    setNotification('Favorite status updated!');
  };

  const startTimer = (taskId) => {
    if (timerTaskId) {
      alert('Another timer is running. Please stop it first.');
      return;
    }
    setTimerTaskId(taskId);
    setTimerStart(Date.now());
    setNotification('Timer started!');
  };

  const stopTimer = (taskId) => {
    if (timerTaskId !== taskId) return;
    const elapsed = Math.floor((Date.now() - timerStart) / 60000); // in minutes
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId 
          ? { ...task, timeSpent: task.timeSpent + elapsed, history: [...task.history, `Timer stopped; ${elapsed} minutes added on ${new Date().toLocaleString()}`] }
          : task
      )
    );
    setTimerTaskId(null);
    setTimerStart(null);
    setNotification(`Timer stopped; ${elapsed} minutes logged!`);
  };

  const editTaskNotes = (taskId) => {
    const newNotes = prompt('Edit task notes:', tasks.find(task => task.id === taskId)?.notes || '');
    if (newNotes !== null) {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId 
            ? { ...task, notes: newNotes, history: [...task.history, `Notes updated on ${new Date().toLocaleString()}`] }
            : task
        )
      );
      setNotification('Task notes updated!');
    }
  };

  const snoozeTask = (taskId) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId && task.deadline) {
          const newDeadline = new Date(task.deadline);
          newDeadline.setDate(newDeadline.getDate() + 1);
          return { 
            ...task, 
            deadline: newDeadline.toISOString().split('T')[0],
            history: [...task.history, `Task snoozed to ${newDeadline.toLocaleDateString()} on ${new Date().toLocaleString()}`]
          };
        }
        return task;
      })
    );
    setNotification('Task snoozed by one day!');
  };

  const toggleSelectTask = (taskId) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    } else {
      setSelectedTasks([...selectedTasks, taskId]);
    }
  };

  const bulkRemoveTasks = () => {
    if (window.confirm('Remove selected tasks?')) {
      setTasks(tasks.filter(task => !selectedTasks.includes(task.id)));
      setSelectedTasks([]);
      setNotification('Selected tasks removed!');
    }
  };

  const bulkCompleteTasks = () => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        selectedTasks.includes(task.id)
          ? { ...task, completed: true, history: [...task.history, `Marked complete in bulk on ${new Date().toLocaleString()}`] }
          : task
      )
    );
    setSelectedTasks([]);
    setNotification('Selected tasks marked as completed!');
  };

  const addTimeSpent = (taskId) => {
    const time = prompt('Enter time spent (in minutes):');
    const minutes = parseInt(time, 10);
    if (!isNaN(minutes) && minutes > 0) {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, timeSpent: task.timeSpent + minutes, history: [...task.history, `Added ${minutes} minutes on ${new Date().toLocaleString()}`] }
            : task
        )
      );
      setNotification('Time updated successfully!');
    }
  };

  const addSubtask = (taskId, subtaskName) => {
    if (!subtaskName || !subtaskName.trim()) return;
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, subtasks: [...task.subtasks, { name: subtaskName.trim(), completed: false }] }
          : task
      )
    );
    setNotification('Subtask added successfully!');
  };

  const toggleSubtaskCompletion = (taskId, subtaskIndex) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((subtask, index) =>
                index === subtaskIndex ? { ...subtask, completed: !subtask.completed } : subtask
              ),
            }
          : task
      )
    );
    setNotification('Subtask status updated!');
  };

  const addComment = (taskId) => {
    const comment = prompt('Enter your comment:');
    if (comment && comment.trim()) {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, comments: [...task.comments, comment.trim()], history: [...task.history, `Comment added on ${new Date().toLocaleString()}`] }
            : task
        )
      );
      setNotification('Comment added!');
    }
  };

  const addDependency = (taskId) => {
    const deps = prompt('Enter dependency task IDs (comma separated):');
    if (deps) {
      const depArray = deps.split(',').map(id => id.trim());
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, dependencies: [...task.dependencies, ...depArray], history: [...task.history, `Dependencies added on ${new Date().toLocaleString()}`] }
            : task
        )
      );
      setNotification('Dependencies added!');
    }
  };

  const archiveTask = (taskId) => {
    const taskToArchive = tasks.find(task => task.id === taskId);
    if (taskToArchive) {
      setTasks(tasks.filter(task => task.id !== taskId));
      setArchivedTasks([...archivedTasks, taskToArchive]);
      setNotification('Task archived successfully!');
    }
  };

  const restoreTask = (taskId) => {
    const taskToRestore = archivedTasks.find(task => task.id === taskId);
    if (taskToRestore) {
      setArchivedTasks(archivedTasks.filter(task => task.id !== taskId));
      setTasks([...tasks, taskToRestore]);
      setNotification('Task restored successfully!');
    }
  };

  const removeTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    setNotification('Task removed successfully!');
  };

  const clearCompletedTasks = () => {
    if (window.confirm('Are you sure you want to clear all completed tasks?')) {
      setTasks(tasks.filter(task => !task.completed));
      setNotification('Completed tasks cleared!');
    }
  };

  const clearAllTasks = () => {
    if (window.confirm('Are you sure you want to clear all tasks?')) {
      setTasks([]);
      setNotification('All tasks cleared!');
    }
  };

  const uploadAttachments = (files) => {
    const fileArray = Array.from(files).map(file => file.name);
    setTaskAttachments([...taskAttachments, ...fileArray]);
    setNotification('Attachments uploaded successfully!');
  };

  const sortTasks = (tasksList) => {
    let sorted = [...tasksList];
    if (sortOption === 'Deadline') {
      sorted.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    } else if (sortOption === 'Priority') {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else if (sortOption === 'TimeSpent') {
      sorted.sort((a, b) => b.timeSpent - a.timeSpent);
    }
    return sorted;
  };

  const filteredTasks = sortTasks(
    tasks.filter(task => {
      const matchesFilter =
        filter === 'All'
          ? true
          : filter === 'Completed'
            ? task.completed
            : !task.completed;
      const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || task.category === categoryFilter;
      return matchesFilter && matchesSearch && matchesCategory;
    })
  );

  const currentTasks = filteredTasks.slice(
    (currentPage - 1) * tasksPerPage,
    currentPage * tasksPerPage
  );

  const progress = tasks.length
    ? Math.round((tasks.filter(task => task.completed).length / tasks.length) * 100)
    : 0;

  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reorderedTasks = Array.from(tasks);
    const [movedTask] = reorderedTasks.splice(result.source.index, 1);
    reorderedTasks.splice(result.destination.index, 0, movedTask);
    setTasks(reorderedTasks);
  };

  const isOverdue = (deadline, completed) => {
    if (!deadline) return false;
    const today = new Date().setHours(0, 0, 0, 0);
    const taskDate = new Date(deadline).setHours(0, 0, 0, 0);
    return !completed && taskDate < today;
  };

  return (
    <div className="tasks-container">
      <h2 className="tasks-heading">Task Manager</h2>
      {notification && <p className="notification">{notification}</p>}

      {/* TAB NAVIGATION */}
      <div className="tasks-tabs">
        <button className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>Tasks</button>
        <button className={`tab-button ${activeTab === 'contracts' ? 'active' : ''}`} onClick={() => setActiveTab('contracts')}>Contracts</button>
        <button className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>Reports</button>
      </div>

      {activeTab === 'tasks' && (
        <>
          {/* TASKS INPUT & ACTIONS */}
          <div className="tasks-input">
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter task name..."
              className="task-input-field"
            />
            <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="task-select">
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <input
              type="date"
              value={taskDeadline}
              onChange={(e) => setTaskDeadline(e.target.value)}
              className="task-date-input"
            />
            <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} className="task-select">
              <option value="General">General</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Urgent">Urgent</option>
            </select>
            <input
              type="text"
              value={taskTags}
              onChange={(e) => setTaskTags(e.target.value)}
              placeholder="Enter tags (comma separated)"
              className="task-input-field"
            />
            <input
              type="text"
              value={taskRecurrence}
              onChange={(e) => setTaskRecurrence(e.target.value)}
              placeholder="Enter recurrence (Daily/Weekly/Monthly)"
              className="task-input-field"
            />
            <input
              type="text"
              value={taskCollaborators}
              onChange={(e) => setTaskCollaborators(e.target.value)}
              placeholder="Enter collaborators (comma separated)"
              className="task-input-field"
            />
            <label className="file-upload-wrapper">
              <span className="file-upload-button">Choose Files</span>
              <input
                type="file"
                multiple
                onChange={(e) => uploadAttachments(e.target.files)}
                className="file-upload-input"
              />
            </label>
            <button onClick={addTask} className="task-add-button">Add Task</button>
          </div>

          <div className="task-filter">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="task-search-input"
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="task-select">
              <option value="All">All</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="task-select">
              <option value="All">All Categories</option>
              <option value="General">General</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Urgent">Urgent</option>
            </select>
            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="task-select">
              <option value="None">No Sort</option>
              <option value="Deadline">Sort by Deadline</option>
              <option value="Priority">Sort by Priority</option>
              <option value="TimeSpent">Sort by Time Spent</option>
            </select>
          </div>

          <div className="bulk-actions">
            <button onClick={bulkCompleteTasks} className="bulk-button">Complete Selected</button>
            <button onClick={bulkRemoveTasks} className="bulk-button">Remove Selected</button>
            <button onClick={() => setSelectedTasks([])} className="bulk-button">Clear Selection</button>
          </div>

          <div className="task-summary">
            <p>{filteredTasks.length} tasks</p>
            <p>Progress: {progress}%</p>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="tasks-list">
              {(provided) => (
                <ul className="tasks-list" ref={provided.innerRef} {...provided.droppableProps}>
                  {currentTasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided) => (
                        <li
                          className={`task-item ${isOverdue(task.deadline, task.completed) ? 'overdue' : ''}`}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTasks.includes(task.id)}
                            onChange={() => toggleSelectTask(task.id)}
                            className="task-select-checkbox"
                          />
                          <div className="task-details">
                            <h3 onDoubleClick={() => openEditModal(task)}>
                              {task.name} {task.favorite && <span className="favorite-icon">★</span>}
                            </h3>
                            <p>Priority: {task.priority}</p>
                            <p>Deadline: {task.deadline}</p>
                            <p>Category: {task.category}</p>
                            <p>Reminder: {task.reminder || 'No reminder set'}</p>
                            <p>Time Spent: {task.timeSpent} minutes</p>
                            {task.notes && <p>Notes: {task.notes}</p>}
                            {task.subtasks.length > 0 && (
                              <p>
                                Subtasks: {task.subtasks.filter(s => s.completed).length} / {task.subtasks.length} completed
                              </p>
                            )}
                            {timerTaskId === task.id ? (
                              <button onClick={() => stopTimer(task.id)} className="task-timer-button">Stop Timer</button>
                            ) : (
                              <button onClick={() => startTimer(task.id)} className="task-timer-button">Start Timer</button>
                            )}
                            <button onClick={() => toggleFavorite(task.id)} className="task-favorite-button">
                              {task.favorite ? 'Unfavorite' : 'Favorite'}
                            </button>
                            <button
                              onClick={() => toggleTaskCompletion(task.id)}
                              className={`task-completion-button ${task.completed ? 'completed' : 'not-completed'}`}
                            >
                              {task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                            </button>
                            <button
                              onClick={() => openEditModal(task)}
                              className="task-edit-button"
                            >
                              Edit Task
                            </button>
                            <button onClick={() => duplicateTask(task.id)} className="task-duplicate-button">
                              Duplicate Task
                            </button>
                            <button onClick={() => editTaskNotes(task.id)} className="task-edit-notes-button">
                              Edit Notes
                            </button>
                            <button onClick={() => addTimeSpent(task.id)} className="task-time-button">
                              Add Time
                            </button>
                            <button onClick={() => snoozeTask(task.id)} className="task-snooze-button">
                              Snooze
                            </button>
                            <button onClick={() => alert(task.history.join('\n'))} className="task-history-button">
                              View History
                            </button>
                            <button onClick={() => addComment(task.id)} className="task-comment-button">
                              Add Comment
                            </button>
                            <button onClick={() => alert(task.comments.join('\n') || 'No comments')} className="task-comment-button">
                              View Comments
                            </button>
                            <button onClick={() => addDependency(task.id)} className="task-dependency-button">
                              Add Dependency
                            </button>
                            <button onClick={() => archiveTask(task.id)} className="task-archive-button">
                              Archive Task
                            </button>
                          </div>
                          <button
                            onClick={() => addSubtask(task.id, prompt('Enter subtask name:'))}
                            className="task-subtask-button"
                          >
                            Add Subtask
                          </button>
                          {task.subtasks.map((subtask, idx) => (
                            <div key={idx} className="subtask">
                              <input
                                type="checkbox"
                                checked={subtask.completed}
                                onChange={() => toggleSubtaskCompletion(task.id, idx)}
                              />
                              {subtask.name}
                            </div>
                          ))}
                          <div className="task-actions">
                            <button
                              onClick={() => {
                                const reminderDate = prompt('Enter reminder date (YYYY-MM-DD):');
                                setTasks(prevTasks =>
                                  prevTasks.map(t =>
                                    t.id === task.id ? { ...t, reminder: reminderDate, history: [...t.history, `Reminder set on ${new Date().toLocaleString()}`] } : t
                                  )
                                );
                                setNotification('Reminder set successfully!');
                              }}
                              className="task-action-button"
                            >
                              Set Reminder
                            </button>
                            <button onClick={() => removeTask(task.id)} className="task-action-button">
                              Remove Task
                            </button>
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
            {currentPage > 1 && (
              <button onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
            )}
            {currentPage < totalPages && (
              <button onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
            )}
          </div>

          <div className="tasks-actions">
            <button onClick={exportTasksToExcel} className="task-export-button">Export Tasks to Excel</button>
            <button onClick={clearCompletedTasks} className="task-clear-button">Clear Completed Tasks</button>
            <button onClick={clearAllTasks} className="task-clear-all-button">Clear All Tasks</button>
          </div>

          <div className="task-utilities">
            <button onClick={bulkCompleteTasks} className="task-utility-button">Mark All as Completed</button>
          </div>

          {archivedTasks.length > 0 && (
            <div className="archived-tasks">
              <h3>Archived Tasks</h3>
              <ul>
                {archivedTasks.map(task => (
                  <li key={task.id}>
                    <span>{task.name}</span>
                    <button onClick={() => restoreTask(task.id)}>Restore</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {activeTab === 'contracts' && (
        <div className="contracts-section">
          <h2>Contract Management</h2>
          <div className="contract-form">
            <input
              type="text"
              placeholder="Contract Title"
              value={contractTitle}
              onChange={(e) => setContractTitle(e.target.value)}
              className="contract-input-field"
            />
            <textarea
              placeholder="Contract Content"
              value={contractContent}
              onChange={(e) => setContractContent(e.target.value)}
              className="contract-textarea"
            />
            <button onClick={() => {
              if (!contractTitle.trim() || !contractContent.trim()) {
                alert('Contract title and content cannot be empty.');
                return;
              }
              const newContract = {
                id: uuidv4(),
                title: contractTitle.trim(),
                content: contractContent.trim(),
                createdAt: new Date().toISOString(),
                signed: false,
                history: [`Contract created on ${new Date().toLocaleString()}`]
              };
              setContracts([...contracts, newContract]);
              setContractTitle('');
              setContractContent('');
              setNotification('Contract created successfully!');
            }} className="contract-add-button">Create Contract</button>
          </div>
          <div className="contracts-list">
            {contracts.length > 0 ? (
              <ul>
                {contracts.map(contract => (
                  <li key={contract.id} className="contract-item">
                    <h3>{contract.title}</h3>
                    <p>Created: {new Date(contract.createdAt).toLocaleString()}</p>
                    <p>Status: {contract.signed ? 'Signed' : 'Pending'}</p>
                    <button onClick={() => {
                      setContracts(prev =>
                        prev.map(c =>
                          c.id === contract.id ? { ...c, signed: true, history: [...c.history, `Contract signed on ${new Date().toLocaleString()}`] } : c
                        )
                      );
                      setNotification('Contract signed successfully!');
                    }} className="contract-sign-button" disabled={contract.signed}>
                      {contract.signed ? 'Signed' : 'Sign Contract'}
                    </button>
                    <button onClick={() => setSelectedContract(contract)} className="contract-view-button">
                      View Details
                    </button>
                    <button onClick={() => alert(contract.history.join('\n'))} className="contract-history-button">View History</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No contracts available.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="reports-section">
          <h2>Reports & Analytics</h2>
          <div className="report-card">
            <h3>Total Tasks</h3>
            <p>{tasks.length}</p>
          </div>
          <div className="report-card">
            <h3>Completed Tasks</h3>
            <p>{tasks.filter(task => task.completed).length}</p>
          </div>
          <div className="report-card">
            <h3>Pending Tasks</h3>
            <p>{tasks.length - tasks.filter(task => task.completed).length}</p>
          </div>
          <div className="report-card">
            <h3>Total Time Spent</h3>
            <p>{tasks.reduce((sum, task) => sum + task.timeSpent, 0)} minutes</p>
          </div>
          <div className="report-card">
            <h3>Estimated Earnings</h3>
            <p>${(tasks.reduce((sum, task) => sum + task.timeSpent, 0) * 0.5).toFixed(2)}</p>
          </div>
          <div className="report-chart">
            <p>Chart/Graph integration coming soon...</p>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      <EditTaskModal 
        show={showEditModal} 
        task={taskToEdit} 
        onClose={() => { setShowEditModal(false); setTaskToEdit(null); }} 
        onSave={saveEditedTask} 
      />

      {/* Contract Details Modal */}
      {selectedContract && (
        <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Contract Details</h2>
            <h3>{selectedContract.title}</h3>
            <p>{selectedContract.content}</p>
            <p>Created: {new Date(selectedContract.createdAt).toLocaleString()}</p>
            <p>Status: {selectedContract.signed ? 'Signed' : 'Pending'}</p>
            <h3>History</h3>
            <pre>{selectedContract.history.join('\n')}</pre>
            <button onClick={() => setSelectedContract(null)} className="modal-close-button">Close</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Tasks;
