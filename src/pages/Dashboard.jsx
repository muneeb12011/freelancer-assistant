import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef
} from 'react';
import '../styles/Dashboard.css';
import { Line } from 'react-chartjs-2';
import {
  Typography,
  Grid,
  Card,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Select,
  MenuItem,
  Box,
  useMediaQuery
} from '@mui/material';
import gsap from 'gsap';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { debounce } from 'lodash';
import CountUp from 'react-countup';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend);

/* =============================================================================
   HELPER FUNCTIONS & CUSTOM HOOKS
============================================================================= */
const formatDate = (date) => new Date(date).toLocaleDateString();

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”: `, error);
      return initialValue;
    }
  });
  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”: `, error);
    }
  };
  return [storedValue, setValue];
};

/* =============================================================================
   SUBCOMPONENTS
============================================================================= */

// -------------------- STATS SECTION --------------------
const StatsSection = ({ clients, tasks, deadlines }) => {
  const stats = [
    { label: 'Active Clients', value: clients.filter(c => c.active).length },
    { label: 'Tasks Completed', value: tasks.length },
    { label: 'Upcoming Deadlines', value: deadlines.length }
  ];
  return (
    <Grid container spacing={3} className="dashboard-stats">
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={4} key={index}>
          <Card
            className="stat-card"
            variant="outlined"
            sx={{ padding: '20px', textAlign: 'center', bgcolor: '#222' }}
          >
            <Typography variant="h5" gutterBottom>{stat.label}</Typography>
            <Typography variant="h4">
              <CountUp end={stat.value} duration={2} />
            </Typography>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// -------------------- EXPORT CSV BUTTON --------------------
const ExportCSVButton = ({ data }) => {
  const exportToCSV = () => {
    const fileName = 'clients.xlsx';
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blobData = new Blob([excelBuffer], {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });
    FileSaver.saveAs(blobData, fileName);
  };
  return (
    <Button variant="outlined" onClick={exportToCSV} sx={{ marginLeft: '10px' }}>
      Export Clients
    </Button>
  );
};

// -------------------- CLIENT MANAGEMENT SECTION --------------------
const ClientManagementSection = ({
  clients,
  searchTerm,
  statusFilter,
  debouncedSearch,
  setStatusFilter,
  onEdit,
  onDelete,
  onViewDetails,
  onSortChange,
  onToggleActive,
  onAddClientButtonClick
}) => {
  const filteredClients = useMemo(() => {
    return clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter ? client.status === statusFilter : true)
    );
  }, [clients, searchTerm, statusFilter]);

  return (
    <Box className="client-management" sx={{ marginBottom: '40px' }}>
      <Typography variant="h3" gutterBottom>Client Management</Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <TextField
          placeholder="Search Clients"
          fullWidth
          defaultValue={searchTerm}
          onChange={(e) => debouncedSearch(e.target.value)}
          sx={{ bgcolor: '#1e1e1e', marginBottom: { xs: '10px', md: '0' } }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={onAddClientButtonClick}
          sx={{ marginLeft: { md: '20px' } }}
        >
          Add New Client
        </Button>
      </Box>
      <Select
        fullWidth
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        displayEmpty
        sx={{ marginBottom: '20px', bgcolor: '#1e1e1e' }}
      >
        <MenuItem value="">All Statuses</MenuItem>
        <MenuItem value="In Progress">In Progress</MenuItem>
        <MenuItem value="Completed">Completed</MenuItem>
      </Select>
      <Select
        fullWidth
        defaultValue=""
        onChange={(e) => onSortChange(e.target.value)}
        displayEmpty
        sx={{ marginBottom: '20px', bgcolor: '#1e1e1e' }}
      >
        <MenuItem value="">Sort By</MenuItem>
        <MenuItem value="nameAsc">Name (A-Z)</MenuItem>
        <MenuItem value="nameDesc">Name (Z-A)</MenuItem>
      </Select>
      <TableContainer component={Paper} sx={{ marginTop: '20px', bgcolor: '#1e1e1e' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#fff' }}>Client Name</TableCell>
              <TableCell sx={{ color: '#fff' }}>Project</TableCell>
              <TableCell sx={{ color: '#fff' }}>Status</TableCell>
              <TableCell sx={{ color: '#fff' }}>Active</TableCell>
              <TableCell sx={{ color: '#fff' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client, index) => (
                <TableRow key={index}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.project}</TableCell>
                  <TableCell>{client.status}</TableCell>
                  <TableCell>{client.active ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell>
                    <Button onClick={() => onViewDetails(client)} variant="outlined" size="small" sx={{ marginRight: '8px' }}>
                      View Details
                    </Button>
                    <Button onClick={() => onEdit(client, index)} variant="outlined" size="small" sx={{ marginRight: '8px' }}>
                      Edit
                    </Button>
                    <Button onClick={() => onToggleActive(index)} variant="outlined" size="small" sx={{ marginRight: '8px' }}>
                      {client.active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button onClick={() => onDelete(index)} variant="outlined" size="small" color="error">
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">No clients found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// -------------------- PRODUCTIVITY CHART SECTION --------------------
const ProductivityChartSection = ({ productivity }) => {
  return (
    <Box className="chart-section" sx={{ marginBottom: '40px' }}>
      <Typography variant="h3" gutterBottom>Productivity Analytics</Typography>
      <Box
        className="chart-container"
        sx={{
          marginTop: '20px',
          bgcolor: '#1e1e1e',
          padding: '20px',
          borderRadius: '8px'
        }}
      >
        <Line data={productivity} />
      </Box>
    </Box>
  );
};

// -------------------- RECENT ACTIVITY SECTION --------------------
const RecentActivitySection = ({
  recentActivity,
  taskFilter,
  setTaskFilter,
  onUpdateActivityStatus,
  onDeleteActivity,
  onEditActivity,
  onOpenTaskDialog
}) => {
  const filteredActivities = useMemo(() => {
    if (taskFilter === 'All') return recentActivity;
    return recentActivity.filter(activity => activity.priority === taskFilter);
  }, [recentActivity, taskFilter]);

  return (
    <Box className="recent-activity" sx={{ marginBottom: '40px' }}>
      <Typography variant="h3" gutterBottom>Recent Activity</Typography>
      <Select
        fullWidth
        value={taskFilter}
        onChange={(e) => setTaskFilter(e.target.value)}
        displayEmpty
        sx={{ marginBottom: '20px', bgcolor: '#1e1e1e' }}
      >
        <MenuItem value="All">All Tasks</MenuItem>
        <MenuItem value="High">High Priority</MenuItem>
        <MenuItem value="Medium">Medium Priority</MenuItem>
        <MenuItem value="Low">Low Priority</MenuItem>
      </Select>
      <TableContainer component={Paper} sx={{ bgcolor: '#1e1e1e' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#fff' }}>Title</TableCell>
              <TableCell sx={{ color: '#fff' }}>Status</TableCell>
              <TableCell sx={{ color: '#fff' }}>Priority</TableCell>
              <TableCell sx={{ color: '#fff' }}>Timestamp</TableCell>
              <TableCell sx={{ color: '#fff' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity, index) => (
                <TableRow key={index}>
                  <TableCell>{activity.title}</TableCell>
                  <TableCell>{activity.status}</TableCell>
                  <TableCell>{activity.priority}</TableCell>
                  <TableCell>{activity.timestamp ? formatDate(activity.timestamp) : ''}</TableCell>
                  <TableCell>
                    {activity.status !== 'Completed' && (
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ marginRight: '8px' }}
                        onClick={() => onUpdateActivityStatus(index, 'Completed')}
                      >
                        Mark Completed
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ marginRight: '8px' }}
                      onClick={() => onEditActivity(index)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => onDeleteActivity(index)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">No activities found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Button
        variant="contained"
        color="primary"
        sx={{ marginTop: '20px' }}
        onClick={onOpenTaskDialog}
      >
        Add Activity
      </Button>
    </Box>
  );
};

// -------------------- DEADLINES SECTION --------------------
const DeadlinesSection = ({
  deadlines,
  selectedDate,
  setSelectedDate,
  onAddDeadline,
  onCompleteDeadline,
  onDeleteDeadline
}) => {
  const tileContent = useCallback(
    ({ date }) => {
      const hasDeadline = deadlines.some(
        (deadline) => new Date(deadline.date).toDateString() === date.toDateString()
      );
      return hasDeadline ? <span>📅</span> : null;
    },
    [deadlines]
  );
  return (
    <Box className="deadlines-section" sx={{ marginBottom: '40px' }}>
      <Typography variant="h3" gutterBottom>Upcoming Deadlines</Typography>
      <div className="calendar-wrapper">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileContent={tileContent}
        />
      </div>
      <Button variant="contained" color="primary" sx={{ marginTop: '20px' }} onClick={onAddDeadline}>
        Add New Deadline
      </Button>
      <TableContainer component={Paper} sx={{ marginTop: '20px', bgcolor: '#1e1e1e' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#fff' }}>Description</TableCell>
              <TableCell sx={{ color: '#fff' }}>Date</TableCell>
              <TableCell sx={{ color: '#fff' }}>Status</TableCell>
              <TableCell sx={{ color: '#fff' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deadlines.length > 0 ? (
              deadlines.map((deadline, index) => (
                <TableRow key={index}>
                  <TableCell>{deadline.description}</TableCell>
                  <TableCell>{formatDate(deadline.date)}</TableCell>
                  <TableCell>{deadline.completed ? 'Completed' : 'Pending'}</TableCell>
                  <TableCell>
                    <Button variant="outlined" onClick={() => onCompleteDeadline(index)} sx={{ marginRight: '8px' }}>
                      {deadline.completed ? 'Undo' : 'Complete'}
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={() => onDeleteDeadline(index)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">No upcoming deadlines found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// -------------------- AI INSIGHTS SECTION --------------------
const AIInsightsSection = ({ clients, deadlines, recentActivity }) => {
  const insights = useMemo(() => {
    const activeClients = clients.filter(c => c.active);
    const pendingDeadlines = deadlines.filter(d => !d.completed);
    const recentTaskCount = recentActivity.length;
    let suggestions = [];
    if (activeClients.length > 0) {
      suggestions.push(`You have ${activeClients.length} active clients. Consider scheduling follow-up meetings.`);
    }
    if (pendingDeadlines.length > 0) {
      suggestions.push(`You have ${pendingDeadlines.length} pending deadlines. Prioritize these tasks to stay on track.`);
    }
    if (recentTaskCount > 5) {
      suggestions.push(`Your recent activity is high. Consider delegating tasks where possible.`);
    } else {
      suggestions.push(`Your recent activity is moderate. Consider taking on new projects to boost productivity.`);
    }
    return suggestions;
  }, [clients, deadlines, recentActivity]);

  return (
    <Box className="ai-insights" sx={{ marginBottom: '40px', bgcolor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
      <Typography variant="h3" gutterBottom>AI Insights</Typography>
      {insights.map((insight, index) => (
        <Typography key={index} variant="body1" color="white" sx={{ marginBottom: '10px' }}>
          {insight}
        </Typography>
      ))}
    </Box>
  );
};

// -------------------- AI ASSISTANT SECTION --------------------
const AIAssistantSection = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');

  const handleAskAI = () => {
    if (!query.trim()) return;
    setResponse(`AI Suggestion: Based on your dashboard metrics, consider optimizing your client outreach strategy.`);
  };

  return (
    <Box className="ai-assistant" sx={{ marginBottom: '40px', bgcolor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
      <Typography variant="h3" gutterBottom>AI Assistant</Typography>
      <Typography variant="body1" gutterBottom>
        Ask your questions or get suggestions:
      </Typography>
      <TextField
        fullWidth
        placeholder="Enter your question..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ bgcolor: '#fff', borderRadius: '4px', marginBottom: '10px' }}
      />
      <Button variant="contained" color="primary" onClick={handleAskAI}>
        Ask AI
      </Button>
      {response && (
        <Box sx={{ marginTop: '20px', backgroundColor: '#333', padding: '15px', borderRadius: '8px' }}>
          <Typography variant="body1" color="white">{response}</Typography>
        </Box>
      )}
    </Box>
  );
};

// -------------------- AI PROJECT PLANNER SECTION --------------------
const AIProjectPlannerSection = () => {
  const [projectDesc, setProjectDesc] = useState('');
  const [planResponse, setPlanResponse] = useState('');

  const handleGeneratePlan = () => {
    if (!projectDesc.trim()) return;
    setPlanResponse(`Project Plan: For your project "${projectDesc}", we suggest a kickoff meeting followed by weekly sprints over 6 weeks.`);
  };

  return (
    <Box className="ai-project-planner" sx={{ marginBottom: '40px', bgcolor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
      <Typography variant="h3" gutterBottom>AI Project Planner</Typography>
      <TextField
        fullWidth
        multiline
        rows={3}
        placeholder="Describe your project briefly..."
        value={projectDesc}
        onChange={(e) => setProjectDesc(e.target.value)}
        sx={{ bgcolor: '#fff', borderRadius: '4px', marginBottom: '10px' }}
      />
      <Button variant="contained" color="primary" onClick={handleGeneratePlan}>
        Generate Project Plan
      </Button>
      {planResponse && (
        <Box sx={{ marginTop: '20px', backgroundColor: '#333', padding: '15px', borderRadius: '8px' }}>
          <Typography variant="body1" color="white">{planResponse}</Typography>
        </Box>
      )}
    </Box>
  );
};

// -------------------- AI TASK PRIORITIZER SECTION --------------------
const AITaskPrioritizerSection = ({ recentActivity }) => {
  const [prioritizedTasks, setPrioritizedTasks] = useState([]);

  const handlePrioritizeTasks = () => {
    if (!recentActivity.length) return;
    const completed = recentActivity.filter(a => a.status === 'Completed');
    const inProgress = recentActivity.filter(a => a.status === 'In Progress');
    const pending = recentActivity.filter(a => a.status === 'Pending');
    setPrioritizedTasks([...inProgress, ...pending, ...completed]);
  };

  return (
    <Box className="ai-task-prioritizer" sx={{ marginBottom: '40px', bgcolor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
      <Typography variant="h3" gutterBottom>AI Task Prioritizer</Typography>
      <Button variant="contained" color="primary" onClick={handlePrioritizeTasks}>
        Prioritize Tasks
      </Button>
      {prioritizedTasks.length > 0 && (
        <Box sx={{ marginTop: '20px', backgroundColor: '#333', padding: '15px', borderRadius: '8px' }}>
          <Typography variant="body1" color="white">Prioritized Tasks:</Typography>
          <ul>
            {prioritizedTasks.map((task, index) => (
              <li key={index} style={{ color: 'white', marginBottom: '5px' }}>
                {task.title} [{task.status}] - Priority: {task.priority}
              </li>
            ))}
          </ul>
        </Box>
      )}
    </Box>
  );
};

// -------------------- AI PREDICTIVE ANALYTICS SECTION --------------------
const AIPredictiveAnalyticsSection = ({ clients, deadlines, recentActivity }) => {
  const [prediction, setPrediction] = useState('');

  const handlePredict = () => {
    const activeClients = clients.filter(c => c.active).length;
    const pendingDeadlines = deadlines.filter(d => !d.completed).length;
    const forecast = activeClients * 10 + pendingDeadlines * 5;
    setPrediction(`Based on current metrics, you might see an increase in revenue by approximately $${forecast}K next month.`);
  };

  return (
    <Box className="ai-predictive-analytics" sx={{ marginBottom: '40px', bgcolor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
      <Typography variant="h3" gutterBottom>AI Predictive Analytics</Typography>
      <Button variant="contained" color="primary" onClick={handlePredict}>
        Predict Next Month
      </Button>
      {prediction && (
        <Box sx={{ marginTop: '20px', backgroundColor: '#333', padding: '15px', borderRadius: '8px' }}>
          <Typography variant="body1" color="white">{prediction}</Typography>
        </Box>
      )}
    </Box>
  );
};

// -------------------- AI COLLABORATION RECOMMENDER SECTION --------------------
const AICollaborationRecommenderSection = ({ clients }) => {
  const [recommendation, setRecommendation] = useState('');

  const handleRecommend = () => {
    if (!clients.length) {
      setRecommendation('No clients found for recommendations.');
      return;
    }
    setRecommendation('AI Recommends collaborating with "Client A" for cross-promotional services.');
  };

  return (
    <Box className="ai-collab-recommender" sx={{ marginBottom: '40px', bgcolor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
      <Typography variant="h3" gutterBottom>AI Collaboration Recommender</Typography>
      <Button variant="contained" color="primary" onClick={handleRecommend}>
        Recommend Collaboration
      </Button>
      {recommendation && (
        <Box sx={{ marginTop: '20px', backgroundColor: '#333', padding: '15px', borderRadius: '8px' }}>
          <Typography variant="body1" color="white">{recommendation}</Typography>
        </Box>
      )}
    </Box>
  );
};

// -------------------- AI SUMMARIZER SECTION --------------------
const AISummarizerSection = ({ recentActivity, clients }) => {
  const [summary, setSummary] = useState('');

  const handleSummarize = () => {
    if (!recentActivity.length && !clients.length) {
      setSummary('No data to summarize.');
      return;
    }
    const activeClients = clients.filter(c => c.active).length;
    const completedTasks = recentActivity.filter(a => a.status === 'Completed').length;
    setSummary(`You have ${activeClients} active clients and ${completedTasks} completed tasks recently.`);
  };

  return (
    <Box className="ai-summarizer" sx={{ marginBottom: '40px', bgcolor: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
      <Typography variant="h3" gutterBottom>AI Summarizer</Typography>
      <Button variant="contained" color="primary" onClick={handleSummarize}>
        Summarize Data
      </Button>
      {summary && (
        <Box sx={{ marginTop: '20px', backgroundColor: '#333', padding: '15px', borderRadius: '8px' }}>
          <Typography variant="body1" color="white">{summary}</Typography>
        </Box>
      )}
    </Box>
  );
};

/* =============================================================================
   DIALOG COMPONENTS
============================================================================= */
const DeleteConfirmationDialog = ({ open, onClose, onConfirm, itemType }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Confirm Deletion</DialogTitle>
    <DialogContent>
      <Typography>Are you sure you want to delete this {itemType}?</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="secondary">Cancel</Button>
      <Button onClick={onConfirm} color="primary" variant="contained">Delete</Button>
    </DialogActions>
  </Dialog>
);

const AddClientDialog = ({ open, onClose, newClient, setNewClient, onAddClient }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Add New Client</DialogTitle>
    <DialogContent>
      <TextField
        label="Client Name"
        fullWidth
        margin="normal"
        value={newClient.name}
        onChange={(e) => setNewClient({ ...newClient, name: e.target.value.trimStart() })}
      />
      <TextField
        label="Project"
        fullWidth
        margin="normal"
        value={newClient.project}
        onChange={(e) => setNewClient({ ...newClient, project: e.target.value.trimStart() })}
      />
      <Select
        fullWidth
        margin="normal"
        value={newClient.status}
        onChange={(e) => setNewClient({ ...newClient, status: e.target.value })}
      >
        <MenuItem value="In Progress">In Progress</MenuItem>
        <MenuItem value="Completed">Completed</MenuItem>
      </Select>
      <Select
        fullWidth
        margin="normal"
        value={newClient.active ? 'Active' : 'Inactive'}
        onChange={(e) => setNewClient({ ...newClient, active: e.target.value === 'Active' })}
      >
        <MenuItem value="Active">Active</MenuItem>
        <MenuItem value="Inactive">Inactive</MenuItem>
      </Select>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="secondary">Cancel</Button>
      <Button onClick={onAddClient} color="primary" variant="contained">Save Client</Button>
    </DialogActions>
  </Dialog>
);

const AddDeadlineDialog = ({ open, onClose, newDeadline, setNewDeadline, onAddDeadline }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Add New Deadline</DialogTitle>
    <DialogContent>
      <TextField
        label="Deadline Description"
        fullWidth
        margin="normal"
        value={newDeadline.description}
        onChange={(e) => setNewDeadline({ ...newDeadline, description: e.target.value })}
      />
      <TextField
        label="Deadline Date"
        type="date"
        fullWidth
        margin="normal"
        value={newDeadline.date.toISOString().split('T')[0]}
        onChange={(e) => setNewDeadline({ ...newDeadline, date: new Date(e.target.value) })}
        InputLabelProps={{ shrink: true }}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="secondary">Cancel</Button>
      <Button onClick={onAddDeadline} color="primary" variant="contained">Add Deadline</Button>
    </DialogActions>
  </Dialog>
);

const AddActivityDialog = ({ open, onClose, newActivity, setNewActivity, onAddActivity }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Add New Activity</DialogTitle>
    <DialogContent>
      <TextField
        label="Activity Title"
        fullWidth
        margin="normal"
        value={newActivity.title}
        onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
      />
      <Select
        fullWidth
        margin="normal"
        value={newActivity.status}
        onChange={(e) => setNewActivity({ ...newActivity, status: e.target.value })}
      >
        <MenuItem value="Pending">Pending</MenuItem>
        <MenuItem value="In Progress">In Progress</MenuItem>
        <MenuItem value="Completed">Completed</MenuItem>
      </Select>
      <Select
        fullWidth
        margin="normal"
        value={newActivity.priority}
        onChange={(e) => setNewActivity({ ...newActivity, priority: e.target.value })}
      >
        <MenuItem value="High">High</MenuItem>
        <MenuItem value="Medium">Medium</MenuItem>
        <MenuItem value="Low">Low</MenuItem>
      </Select>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="secondary">Cancel</Button>
      <Button onClick={onAddActivity} color="primary" variant="contained">Add Activity</Button>
    </DialogActions>
  </Dialog>
);

const EditActivityDialog = ({ open, onClose, activityToEdit, setActivityToEdit, onSaveActivity }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Edit Activity</DialogTitle>
    <DialogContent>
      <TextField
        label="Activity Title"
        fullWidth
        margin="normal"
        value={activityToEdit.title}
        onChange={(e) => setActivityToEdit({ ...activityToEdit, title: e.target.value })}
      />
      <Select
        fullWidth
        margin="normal"
        value={activityToEdit.status}
        onChange={(e) => setActivityToEdit({ ...activityToEdit, status: e.target.value })}
      >
        <MenuItem value="Pending">Pending</MenuItem>
        <MenuItem value="In Progress">In Progress</MenuItem>
        <MenuItem value="Completed">Completed</MenuItem>
      </Select>
      <Select
        fullWidth
        margin="normal"
        value={activityToEdit.priority}
        onChange={(e) => setActivityToEdit({ ...activityToEdit, priority: e.target.value })}
      >
        <MenuItem value="High">High</MenuItem>
        <MenuItem value="Medium">Medium</MenuItem>
        <MenuItem value="Low">Low</MenuItem>
      </Select>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="secondary">Cancel</Button>
      <Button onClick={onSaveActivity} color="primary" variant="contained">Save Changes</Button>
    </DialogActions>
  </Dialog>
);

const ClientDetailsDialog = ({ open, onClose, client }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Client Details</DialogTitle>
    <DialogContent>
      {client ? (
        <>
          <Typography variant="h6">Name: {client.name}</Typography>
          <Typography variant="body1">Project: {client.project}</Typography>
          <Typography variant="body1">Status: {client.status}</Typography>
          <Typography variant="body1">Active: {client.active ? 'Active' : 'Inactive'}</Typography>
          <Typography variant="caption">Additional details can be displayed here.</Typography>
        </>
      ) : (
        <Typography>No client details available.</Typography>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary" variant="contained">Close</Button>
    </DialogActions>
  </Dialog>
);

/* =============================================================================
   MAIN DASHBOARD COMPONENT
============================================================================= */
const Dashboard = () => {
  // Local Storage States
  const [clients, setClients] = useLocalStorage('clients', []);
  const [deadlines, setDeadlines] = useLocalStorage('deadlines', []);
  const [recentActivity, setRecentActivity] = useLocalStorage('recentActivity', []);

  // Other States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [taskFilter, setTaskFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [error, setError] = useState('');

  // Dialog States
  const [newClientDialog, setNewClientDialog] = useState(false);
  const [editingClientDialog, setEditingClientDialog] = useState(false);
  const [newDeadlineDialog, setNewDeadlineDialog] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [deleteConfirmationDialog, setDeleteConfirmationDialog] = useState(false);
  const [clientDetailsDialog, setClientDetailsDialog] = useState(false);
  const [editActivityDialog, setEditActivityDialog] = useState(false);

  // Items for delete/edit operations
  const [clientToDelete, setClientToDelete] = useState(null);
  const [deadlineToDelete, setDeadlineToDelete] = useState(null);
  const [editedClient, setEditedClient] = useState({ name: '', project: '', status: '', index: null });
  const [newClient, setNewClient] = useState({ name: '', project: '', status: '', active: true });
  const [newDeadline, setNewDeadline] = useState({ description: '', date: new Date() });
  const [newActivityDialogData, setNewActivityDialogData] = useState({ title: '', status: 'Pending', priority: 'Medium' });
  const [activityToEdit, setActivityToEdit] = useState({ title: '', status: 'Pending', priority: 'Medium', index: null });
  const [clientDetails, setClientDetails] = useState(null);

  // Productivity Chart Data
  const productivity = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Hours Worked',
        data: [5, 6, 7, 4, 8, 3, 2],
        borderColor: '#3f51b5',
        backgroundColor: 'rgba(63, 81, 181, 0.3)',
        tension: 0.4
      }
    ]
  };

  // Check if mobile (for additional responsive tweaks)
  const isMobile = useMediaQuery('(max-width:768px)');

  // Initial Data Setup (once)
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const timer = setTimeout(() => {
      if (clients.length === 0) {
        setClients([
          { name: 'Client A', project: 'Website Development', status: 'In Progress', active: true },
          { name: 'Client B', project: 'Mobile App Design', status: 'Completed', active: false }
        ]);
      }
      if (recentActivity.length === 0) {
        setRecentActivity([
          { title: 'Completed Project Alpha milestone', status: 'Completed', priority: 'High', timestamp: new Date() },
          { title: 'Updated profile on freelancing platform', status: 'Pending', priority: 'Medium', timestamp: new Date() }
        ]);
      }
      if (deadlines.length === 0) {
        setDeadlines([]);
      }
      gsap.from('.stat-card', { opacity: 0, y: 50, duration: 0.8, stagger: 0.2 });
    }, 1000);
    return () => clearTimeout(timer);
  }, [clients, deadlines, recentActivity, setClients, setDeadlines, setRecentActivity]);

  // Debounced Search
  const debouncedSearch = useMemo(() => debounce((value) => setSearchTerm(value), 300), []);

  // Auto-clear error messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // ===================== HANDLER FUNCTIONS =====================
  const handleAddClient = useCallback(() => {
    if (!newClient.name.trim() || !newClient.project.trim() || !newClient.status) {
      setError('All client fields are required.');
      return;
    }
    const updatedClients = [...clients, {
      ...newClient,
      name: newClient.name.trim(),
      project: newClient.project.trim()
    }];
    setClients(updatedClients);
    setNewClient({ name: '', project: '', status: '', active: true });
    setNewClientDialog(false);
    setSnackbarOpen(true);
  }, [newClient, clients, setClients]);

  const handleEditClient = useCallback(() => {
    if (!editedClient.name.trim() || !editedClient.project.trim() || !editedClient.status) {
      setError('All fields are required to edit a client.');
      return;
    }
    const updatedClients = [...clients];
    updatedClients[editedClient.index] = {
      ...editedClient,
      name: editedClient.name.trim(),
      project: editedClient.project.trim()
    };
    setClients(updatedClients);
    setEditedClient({ name: '', project: '', status: '', index: null });
    setEditingClientDialog(false);
    setSnackbarOpen(true);
  }, [editedClient, clients, setClients]);

  const handleToggleClientActive = useCallback((index) => {
    const updatedClients = [...clients];
    updatedClients[index].active = !updatedClients[index].active;
    setClients(updatedClients);
    setSnackbarOpen(true);
  }, [clients, setClients]);

  const handleViewClientDetails = useCallback((client) => {
    setClientDetails(client);
    setClientDetailsDialog(true);
  }, []);

  const confirmDeleteClient = useCallback((index) => {
    setClientToDelete(index);
    setDeleteConfirmationDialog(true);
  }, []);

  const handleDeleteClient = useCallback(() => {
    const updatedClients = clients.filter((_, i) => i !== clientToDelete);
    setClients(updatedClients);
    setDeleteConfirmationDialog(false);
    setSnackbarOpen(true);
  }, [clients, clientToDelete, setClients]);

  const handleAddDeadline = useCallback(() => {
    if (!newDeadline.description.trim() || !newDeadline.date) {
      setError('Both description and date are required for a deadline.');
      return;
    }
    const updatedDeadlines = [...deadlines, {
      ...newDeadline,
      description: newDeadline.description.trim(),
      completed: false
    }];
    setDeadlines(updatedDeadlines);
    setNewDeadline({ description: '', date: new Date() });
    setNewDeadlineDialog(false);
    setSnackbarOpen(true);
  }, [newDeadline, deadlines, setDeadlines]);

  const confirmDeleteDeadline = useCallback((index) => {
    setDeadlineToDelete(index);
    setDeleteConfirmationDialog(true);
  }, []);

  const handleDeleteDeadline = useCallback(() => {
    const updatedDeadlines = deadlines.filter((_, i) => i !== deadlineToDelete);
    setDeadlines(updatedDeadlines);
    setDeleteConfirmationDialog(false);
    setSnackbarOpen(true);
  }, [deadlines, deadlineToDelete, setDeadlines]);

  const handleCompleteDeadline = useCallback((index) => {
    const updatedDeadlines = [...deadlines];
    updatedDeadlines[index].completed = !updatedDeadlines[index].completed;
    setDeadlines(updatedDeadlines);
  }, [deadlines, setDeadlines]);

  const handleSortClients = useCallback((sortOrder) => {
    let sortedClients = [...clients];
    if (sortOrder === 'nameAsc') {
      sortedClients.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'nameDesc') {
      sortedClients.sort((a, b) => b.name.localeCompare(a.name));
    }
    setClients(sortedClients);
  }, [clients, setClients]);

  // ===================== RECENT ACTIVITY HANDLERS =====================
  const handleAddActivity = useCallback(() => {
    if (!newActivityDialogData.title.trim()) {
      setError('Activity title cannot be empty.');
      return;
    }
    const newActivity = {
      title: newActivityDialogData.title.trim(),
      status: newActivityDialogData.status,
      priority: newActivityDialogData.priority,
      timestamp: new Date()
    };
    const updatedActivities = [...recentActivity, newActivity];
    setRecentActivity(updatedActivities);
    setNewActivityDialogData({ title: '', status: 'Pending', priority: 'Medium' });
    setTaskDialogOpen(false);
    setSnackbarOpen(true);
  }, [newActivityDialogData, recentActivity, setRecentActivity]);

  const handleUpdateActivityStatus = useCallback((index, newStatus) => {
    const updatedActivities = [...recentActivity];
    updatedActivities[index].status = newStatus;
    setRecentActivity(updatedActivities);
    setSnackbarOpen(true);
  }, [recentActivity, setRecentActivity]);

  const handleDeleteActivity = useCallback((index) => {
    const updatedActivities = recentActivity.filter((_, i) => i !== index);
    setRecentActivity(updatedActivities);
    setSnackbarOpen(true);
  }, [recentActivity, setRecentActivity]);

  const handleEditActivity = useCallback((index) => {
    const activity = recentActivity[index];
    setActivityToEdit({ ...activity, index });
    setEditActivityDialog(true);
  }, [recentActivity]);

  const handleSaveActivity = useCallback(() => {
    if (!activityToEdit.title.trim()) {
      setError('Activity title cannot be empty.');
      return;
    }
    const updatedActivities = [...recentActivity];
    updatedActivities[activityToEdit.index] = {
      ...activityToEdit,
      title: activityToEdit.title.trim()
    };
    setRecentActivity(updatedActivities);
    setActivityToEdit({ title: '', status: 'Pending', priority: 'Medium', index: null });
    setEditActivityDialog(false);
    setSnackbarOpen(true);
  }, [activityToEdit, recentActivity, setRecentActivity]);

  // ===================== RENDERING THE DASHBOARD =====================
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        {/* Using isMobile to adjust the header font size */}
        <Typography variant="h2" sx={{ fontSize: isMobile ? '2rem' : '2.75rem' }}>
          Freelancer Assistant Dashboard
        </Typography>
        <ExportCSVButton data={clients} />
      </div>

      <StatsSection
        clients={clients}
        tasks={recentActivity}
        deadlines={deadlines}
      />

      <ClientManagementSection
        clients={clients}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        debouncedSearch={debouncedSearch}
        setStatusFilter={setStatusFilter}
        onEdit={(client, index) => {
          setEditedClient({ ...client, index });
          setEditingClientDialog(true);
        }}
        onDelete={(index) => confirmDeleteClient(index)}
        onViewDetails={handleViewClientDetails}
        onSortChange={handleSortClients}
        onToggleActive={handleToggleClientActive}
        onAddClientButtonClick={() => setNewClientDialog(true)}
      />

      <ProductivityChartSection productivity={productivity} />

      <RecentActivitySection
        recentActivity={recentActivity}
        taskFilter={taskFilter}
        setTaskFilter={setTaskFilter}
        onUpdateActivityStatus={handleUpdateActivityStatus}
        onDeleteActivity={handleDeleteActivity}
        onEditActivity={handleEditActivity}
        onOpenTaskDialog={() => setTaskDialogOpen(true)}
      />

      <DeadlinesSection
        deadlines={deadlines}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        onAddDeadline={() => setNewDeadlineDialog(true)}
        onCompleteDeadline={handleCompleteDeadline}
        onDeleteDeadline={confirmDeleteDeadline}
      />

      <AIInsightsSection
        clients={clients}
        deadlines={deadlines}
        recentActivity={recentActivity}
      />
      <AIAssistantSection />
      <AIProjectPlannerSection />
      <AITaskPrioritizerSection recentActivity={recentActivity} />
      <AIPredictiveAnalyticsSection
        clients={clients}
        deadlines={deadlines}
        recentActivity={recentActivity}
      />
      <AICollaborationRecommenderSection clients={clients} />
      <AISummarizerSection
        recentActivity={recentActivity}
        clients={clients}
      />

      {/* DIALOGS */}
      <AddClientDialog
        open={newClientDialog}
        onClose={() => setNewClientDialog(false)}
        newClient={newClient}
        setNewClient={setNewClient}
        onAddClient={handleAddClient}
      />

      <Dialog
        open={editingClientDialog}
        onClose={() => setEditingClientDialog(false)}
      >
        <DialogTitle>Edit Client</DialogTitle>
        <DialogContent>
          <TextField
            label="Client Name"
            fullWidth
            margin="normal"
            value={editedClient.name}
            onChange={(e) => setEditedClient({ ...editedClient, name: e.target.value })}
          />
          <TextField
            label="Project"
            fullWidth
            margin="normal"
            value={editedClient.project}
            onChange={(e) => setEditedClient({ ...editedClient, project: e.target.value })}
          />
          <TextField
            label="Status"
            fullWidth
            margin="normal"
            value={editedClient.status}
            onChange={(e) => setEditedClient({ ...editedClient, status: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingClientDialog(false)} color="secondary">Cancel</Button>
          <Button onClick={handleEditClient} color="primary">Save Changes</Button>
        </DialogActions>
      </Dialog>

      <AddDeadlineDialog
        open={newDeadlineDialog}
        onClose={() => setNewDeadlineDialog(false)}
        newDeadline={newDeadline}
        setNewDeadline={setNewDeadline}
        onAddDeadline={handleAddDeadline}
      />

      <AddActivityDialog
        open={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
        newActivity={newActivityDialogData}
        setNewActivity={setNewActivityDialogData}
        onAddActivity={handleAddActivity}
      />

      <EditActivityDialog
        open={editActivityDialog}
        onClose={() => setEditActivityDialog(false)}
        activityToEdit={activityToEdit}
        setActivityToEdit={setActivityToEdit}
        onSaveActivity={handleSaveActivity}
      />

      <DeleteConfirmationDialog
        open={deleteConfirmationDialog}
        onClose={() => setDeleteConfirmationDialog(false)}
        onConfirm={() => {
          if (clientToDelete !== null) {
            handleDeleteClient();
          } else if (deadlineToDelete !== null) {
            handleDeleteDeadline();
          }
        }}
        itemType={clientToDelete !== null ? 'client' : 'deadline'}
      />

      <ClientDetailsDialog
        open={clientDetailsDialog}
        onClose={() => setClientDetailsDialog(false)}
        client={clientDetails}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        message="Action successful"
        onClose={() => setSnackbarOpen(false)}
      />
      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={3000}
          message={error}
          onClose={() => setError('')}
        />
      )}

      <Box sx={{ height: '200px' }}></Box>
      <Box sx={{ textAlign: 'center', padding: '20px', color: '#777' }}>
        <Typography variant="caption">© 2025 Freelancer Assistant. All rights reserved.</Typography>
      </Box>
    </div>
  );
};

export default Dashboard;
