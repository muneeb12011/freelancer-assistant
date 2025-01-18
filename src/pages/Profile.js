// src/pages/Profile.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Profile.css'; // Add your styling for this page

const Profile = () => {
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'johndoe@example.com',
    role: 'Freelancer',
    profilePicture: 'https://via.placeholder.com/150', // Placeholder image
    bio: 'Passionate freelancer with a love for tech and design. Always looking for new challenges.',
    location: 'New York, USA',
    skills: ['JavaScript', 'React', 'Python', 'CSS', 'HTML'],
    projects: [
      { id: 1, title: 'Project A', description: 'A web app built with React and Node.js' },
      { id: 2, title: 'Project B', description: 'A Python-based automation script' },
    ],
    socialLinks: {
      linkedin: 'https://www.linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe',
    },
    subscriptionStatus: 'Premium', // Premium or Free
    isVerified: true, // Profile verification status
  });

  const [newSkill, setNewSkill] = useState('');
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [isEditingBio, setIsEditingBio] = useState(false);

  // Handlers for skill addition/removal
  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setUser((prevState) => ({
        ...prevState,
        skills: [...prevState.skills, newSkill],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index) => {
    setUser((prevState) => ({
      ...prevState,
      skills: prevState.skills.filter((_, i) => i !== index),
    }));
  };

  // Handlers for project management
  const handleAddProject = () => {
    if (newProject.title && newProject.description) {
      setUser((prevState) => ({
        ...prevState,
        projects: [
          ...prevState.projects,
          { id: Date.now(), title: newProject.title, description: newProject.description },
        ],
      }));
      setNewProject({ title: '', description: '' });
    }
  };

  const handleDeleteProject = (id) => {
    setUser((prevState) => ({
      ...prevState,
      projects: prevState.projects.filter((project) => project.id !== id),
    }));
  };

  // Handlers for bio editing
  const handleBioChange = (e) => {
    setUser((prevState) => ({
      ...prevState,
      bio: e.target.value,
    }));
  };

  return (
    <div className="profile">
      {/* Profile Header */}
      <div className="profile-header">
        <img
          src={user.profilePicture}
          alt="Profile"
          className="profile-picture"
        />
        <button className="btn btn-small" onClick={() => alert('Upload functionality to be implemented')}>
          Upload Picture
        </button>
        <h2 className="profile-name">{user.name}</h2>
        <p className="profile-role">{user.role}</p>
        <p className="profile-location">{user.location}</p>
        {user.isVerified && <span className="verified-badge">Verified</span>} {/* Verification Badge */}
      </div>

      {/* Bio Section */}
      <div className="profile-bio">
        <h3>About Me</h3>
        {isEditingBio ? (
          <textarea
            value={user.bio}
            onChange={handleBioChange}
            onBlur={() => setIsEditingBio(false)}
          />
        ) : (
          <p onClick={() => setIsEditingBio(true)}>{user.bio}</p>
        )}
      </div>

      {/* Skills Section */}
      <div className="profile-skills">
        <h3>Skills</h3>
        <ul>
          {user.skills.map((skill, index) => (
            <li key={index}>
              {skill} <button onClick={() => handleRemoveSkill(index)}>Remove</button>
            </li>
          ))}
        </ul>
        <input
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          placeholder="Add a new skill"
        />
        <button onClick={handleAddSkill}>Add Skill</button>
      </div>

      {/* Projects Section */}
      <div className="profile-projects">
        <h3>Projects</h3>
        {user.projects.map((project) => (
          <div key={project.id} className="profile-project">
            <strong>{project.title}</strong>
            <p>{project.description}</p>
            <button onClick={() => handleDeleteProject(project.id)}>Delete</button>
          </div>
        ))}
        <input
          type="text"
          value={newProject.title}
          onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
          placeholder="Project title"
        />
        <textarea
          value={newProject.description}
          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
          placeholder="Project description"
        />
        <button onClick={handleAddProject}>Add Project</button>
      </div>

      {/* Subscription Status */}
      <div className="profile-subscription">
        <h3>Subscription Status</h3>
        <p>{user.subscriptionStatus} Plan</p>
        <button onClick={() => alert('Manage subscription functionality to be implemented')}>
          Manage Subscription
        </button>
      </div>

      {/* Social Media Links */}
      <div className="profile-social">
        <h3>Social Links</h3>
        <ul>
          <li><a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
          <li><a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer">GitHub</a></li>
        </ul>
      </div>

      {/* Actions */}
      <div className="profile-actions">
        <Link to="/edit-profile" className="btn btn-primary">
          Edit Profile
        </Link>
        <Link to="/settings" className="btn btn-secondary">
          Account Settings
        </Link>
        <button onClick={() => alert('Account deactivation functionality to be implemented')}>
          Deactivate Account
        </button>
      </div>
    </div>
  );
};

export default Profile;
