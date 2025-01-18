import React, { useEffect, useState } from 'react';
import '../styles/Dashboard.css';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Typography, Grid, Card, Button, Dialog, DialogTitle, DialogContent } from '@mui/material';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom'; // For navigation

ChartJS.register(zoomPlugin);

const Dashboard = () => {
  const navigate = useNavigate(); // Navigation hook for routing

  const [stats, setStats] = useState({
    tasksCompleted: 120,
    activeClients: 15,
    totalInvoices: 10,
    upcomingDeadlines: 3,
  });

  const [taskProgress, setTaskProgress] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Tasks Completed',
        data: [5, 15, 20, 30, 40],
        borderColor: '#66bb6a',
        backgroundColor: 'rgba(102, 187, 106, 0.3)',
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        borderWidth: 2,
      },
    ],
  });

  const [taskBreakdown, setTaskBreakdown] = useState({
    labels: ['Completed', 'Pending', 'Overdue'],
    datasets: [
      {
        data: [70, 20, 10],
        backgroundColor: ['#66bb6a', '#ffa726', '#ef5350'],
        hoverBackgroundColor: ['#43a047', '#ff9800', '#e53935'],
      },
    ],
  });

  const [recentActivity, setRecentActivity] = useState([
    "Completed 'Project Alpha' task for client XYZ.",
    "Sent invoice to client ABC for completed work.",
    "Updated profile with new skills and experience.",
    "Reviewed feedback from client DEF on last project.",
  ]);

  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false); // State for modal visibility

  useEffect(() => {
    setTimeout(() => {
      setStats({
        tasksCompleted: 150,
        activeClients: 20,
        totalInvoices: 12,
        upcomingDeadlines: 5,
      });
      setRecentActivity((prev) => [
        ...prev,
        "Completed 'Project Beta' task for client GHI.",
      ]);
      setLoading(false);

      gsap.from('.stat-card', { opacity: 0, y: 50, duration: 0.8, stagger: 0.2 });
    }, 1000);
  }, []);

  const handleViewFullReport = () => {
    // Option 1: Navigate to a new page
    // navigate('/report'); // Ensure a route `/report` exists in your app

    // Option 2: Open a modal for inline report viewing
    setReportOpen(true);
  };

  const handleCloseReport = () => {
    setReportOpen(false);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <Typography variant="h2" className="dashboard-title">
          Welcome to Your Dashboard!
        </Typography>
      </div>

      {/* Dashboard Stats */}
      <Grid container spacing={3} className="dashboard-stats">
        {loading ? (
          <Typography>Loading stats...</Typography>
        ) : (
          Object.entries(stats).map(([key, value], index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card className="stat-card">
                <Typography variant="h3">{value}</Typography>
                <Typography variant="body1" className="stat-label">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                </Typography>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Task Progress Section */}
      <div className="chart-section">
        <Typography variant="h3">Task Progress</Typography>
        <div className="chart-container">
          <Line
            data={taskProgress}
            options={{
              responsive: true,
              plugins: {
                tooltip: {
                  enabled: true,
                  callbacks: {
                    label: function (tooltipItem) {
                      return `Tasks Completed: ${tooltipItem.raw}`;
                    },
                  },
                },
                zoom: {
                  pan: {
                    enabled: true,
                    mode: 'x',
                  },
                  zoom: {
                    wheel: {
                      enabled: true,
                    },
                    pinch: {
                      enabled: true,
                    },
                    mode: 'x',
                  },
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Months',
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: 'Tasks Completed',
                  },
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
      </div>

      {/* Task Breakdown Section */}
      <div className="chart-section">
        <Typography variant="h3">Task Breakdown</Typography>
        <div className="chart-container" style={{ maxWidth: '300px', margin: '0 auto' }}>
          <Pie data={taskBreakdown} />
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="recent-activity">
        <Typography variant="h3">Recent Activity</Typography>
        {loading ? (
          <Typography>Loading activity...</Typography>
        ) : (
          <ul>
            {recentActivity.map((activity, index) => (
              <li key={index}>{activity}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Additional Features */}
      <div className="additional-features">
        <Button
          variant="contained"
          color="primary"
          style={{ marginTop: '20px' }}
          onClick={handleViewFullReport}
        >
          View Full Report
        </Button>
      </div>

      {/* Modal for Report */}
      <Dialog open={reportOpen} onClose={handleCloseReport}>
        <DialogTitle>Full Report</DialogTitle>
        <DialogContent>
          <Typography variant="h5">Detailed Report Information</Typography>
          <ul>
            <li>Tasks Completed: 150</li>
            <li>Active Clients: 20</li>
            <li>Total Invoices: 12</li>
            <li>Upcoming Deadlines: 5</li>
          </ul>
          <Button onClick={handleCloseReport} color="secondary" style={{ marginTop: '20px' }}>
            Close Report
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
