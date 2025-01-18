// src/pages/Tasks.js
import React, { useState, useEffect } from 'react';
import '../styles/Tasks.css';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('');

  // Load tasks from localStorage on initial render
  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    setTasks(savedTasks);
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!taskName.trim()) {
      alert('Task name cannot be empty.');
      return;
    }
    const newTask = {
      id: tasks.length ? tasks[tasks.length - 1].id + 1 : 1,
      name: taskName.trim(),
      priority: taskPriority,
      deadline: taskDeadline,
      completed: false,
    };
    setTasks([...tasks, newTask]);
    setTaskName('');
    setTaskPriority('Medium');
    setTaskDeadline('');
  };

  const updateTask = (id, updatedTask) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, ...updatedTask } : task
      )
    );
    setEditingTask(null);
  };

  const deleteTask = (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter((task) => task.id !== id));
    }
  };

  const toggleTaskCompletion = (id) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const clearCompletedTasks = () => {
    if (window.confirm('Are you sure you want to clear all completed tasks?')) {
      setTasks(tasks.filter((task) => !task.completed));
    }
  };

  const sortTasks = () => {
    if (sortBy === 'Priority') {
      setTasks([...tasks].sort((a, b) => a.priority.localeCompare(b.priority)));
    } else if (sortBy === 'Deadline') {
      setTasks(
        [...tasks].sort(
          (a, b) => new Date(a.deadline) - new Date(b.deadline)
        )
      );
    }
  };

  useEffect(() => {
    if (sortBy) sortTasks();
  }, [sortBy]);

  const filteredTasks =
    filter === 'All'
      ? tasks
      : filter === 'Completed'
      ? tasks.filter((task) => task.completed)
      : tasks.filter((task) => !task.completed);

  return (
    <div className="tasks-container">
      <h2 className="tasks-heading">Advanced Task Manager</h2>

      {/* Task Input */}
      <div className="tasks-input">
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="Enter task name..."
          className="task-input-field"
        />
        <select
          value={taskPriority}
          onChange={(e) => setTaskPriority(e.target.value)}
          className="task-select"
        >
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
        <button onClick={addTask} className="btn btn-primary">
          Add Task
        </button>
      </div>

      {/* Filters and Sorting */}
      <div className="tasks-controls">
        <div className="tasks-filters">
          {['All', 'Completed', 'Pending'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`filter-button ${
                filter === status ? 'active' : ''
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="tasks-sort">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="task-select"
          >
            <option value="">Sort by...</option>
            <option value="Priority">Priority</option>
            <option value="Deadline">Deadline</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <ul className="tasks-list">
        {filteredTasks.map((task) => (
          <li key={task.id} className="tasks-item">
            {editingTask?.id === task.id ? (
              <input
                type="text"
                value={editingTask.name}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, name: e.target.value })
                }
                className="edit-input"
              />
            ) : (
              <span
                className={`task-name ${
                  task.completed ? 'completed' : ''
                }`}
                onClick={() => toggleTaskCompletion(task.id)}
              >
                {task.name} - {task.priority} -{' '}
                {task.deadline || 'No deadline'}
              </span>
            )}
            <div className="task-actions">
              {editingTask?.id === task.id ? (
                <button
                  onClick={() =>
                    updateTask(task.id, { name: editingTask.name })
                  }
                  className="btn btn-success"
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={() =>
                    setEditingTask({ id: task.id, name: task.name })
                  }
                  className="btn btn-warning"
                >
                  Edit
                </button>
              )}
              <button
                onClick={() => deleteTask(task.id)}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Clear Completed Tasks */}
      {tasks.some((task) => task.completed) && (
        <button
          onClick={clearCompletedTasks}
          className="btn btn-secondary clear-completed"
        >
          Clear Completed Tasks
        </button>
      )}

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <p className="empty-state">No tasks to display.</p>
      )}
    </div>
  );
};

export default Tasks;
