import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  TextField,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  useMediaQuery
} from '@mui/material';
import '../styles/Profile.css';

const countryCodes = [
  { name: 'Afghanistan', dial_code: '+93' },
  { name: 'Albania', dial_code: '+355' },
  { name: 'Algeria', dial_code: '+213' },
  { name: 'Andorra', dial_code: '+376' },
  { name: 'Angola', dial_code: '+244' },
  { name: 'Argentina', dial_code: '+54' },
  { name: 'Armenia', dial_code: '+374' },
  { name: 'Australia', dial_code: '+61' },
  { name: 'Austria', dial_code: '+43' },
  { name: 'Azerbaijan', dial_code: '+994' },
  { name: 'Bahrain', dial_code: '+973' },
  { name: 'Bangladesh', dial_code: '+880' },
  { name: 'Belarus', dial_code: '+375' },
  { name: 'Belgium', dial_code: '+32' },
  { name: 'Belize', dial_code: '+501' },
  { name: 'Benin', dial_code: '+229' },
  { name: 'Bhutan', dial_code: '+975' },
  { name: 'Bolivia', dial_code: '+591' },
  { name: 'Bosnia and Herzegovina', dial_code: '+387' },
  { name: 'Botswana', dial_code: '+267' },
  { name: 'Brazil', dial_code: '+55' },
  { name: 'Brunei', dial_code: '+673' },
  { name: 'Bulgaria', dial_code: '+359' },
  { name: 'Burkina Faso', dial_code: '+226' },
  { name: 'Burundi', dial_code: '+257' },
  { name: 'Cambodia', dial_code: '+855' },
  { name: 'Cameroon', dial_code: '+237' },
  { name: 'Canada', dial_code: '+1' },
  { name: 'Chile', dial_code: '+56' },
  { name: 'China', dial_code: '+86' },
  { name: 'Colombia', dial_code: '+57' },
  { name: 'Costa Rica', dial_code: '+506' },
  { name: 'Croatia', dial_code: '+385' },
  { name: 'Cuba', dial_code: '+53' },
  { name: 'Cyprus', dial_code: '+357' },
  { name: 'Czech Republic', dial_code: '+420' },
  { name: 'Denmark', dial_code: '+45' },
  { name: 'Djibouti', dial_code: '+253' },
  { name: 'Dominican Republic', dial_code: '+1' },
  { name: 'Ecuador', dial_code: '+593' },
  { name: 'Egypt', dial_code: '+20' },
  { name: 'El Salvador', dial_code: '+503' },
  { name: 'Estonia', dial_code: '+372' },
  { name: 'Ethiopia', dial_code: '+251' },
  { name: 'Finland', dial_code: '+358' },
  { name: 'France', dial_code: '+33' },
  { name: 'Gabon', dial_code: '+241' },
  { name: 'Georgia', dial_code: '+995' },
  { name: 'Germany', dial_code: '+49' },
  { name: 'Ghana', dial_code: '+233' },
  { name: 'Greece', dial_code: '+30' },
  { name: 'Guatemala', dial_code: '+502' },
  { name: 'Honduras', dial_code: '+504' },
  { name: 'Hong Kong', dial_code: '+852' },
  { name: 'Hungary', dial_code: '+36' },
  { name: 'Iceland', dial_code: '+354' },
  { name: 'India', dial_code: '+91' },
  { name: 'Indonesia', dial_code: '+62' },
  { name: 'Iran', dial_code: '+98' },
  { name: 'Iraq', dial_code: '+964' },
  { name: 'Ireland', dial_code: '+353' },
  { name: 'Israel', dial_code: '+972' },
  { name: 'Italy', dial_code: '+39' },
  { name: 'Jamaica', dial_code: '+1' },
  { name: 'Japan', dial_code: '+81' },
  { name: 'Jordan', dial_code: '+962' },
  { name: 'Kazakhstan', dial_code: '+7' },
  { name: 'Kenya', dial_code: '+254' },
  { name: 'Kuwait', dial_code: '+965' },
  { name: 'Latvia', dial_code: '+371' },
  { name: 'Lebanon', dial_code: '+961' },
  { name: 'Libya', dial_code: '+218' },
  { name: 'Lithuania', dial_code: '+370' },
  { name: 'Luxembourg', dial_code: '+352' },
  { name: 'Malaysia', dial_code: '+60' },
  { name: 'Malta', dial_code: '+356' },
  { name: 'Mexico', dial_code: '+52' },
  { name: 'Monaco', dial_code: '+377' },
  { name: 'Morocco', dial_code: '+212' },
  { name: 'Netherlands', dial_code: '+31' },
  { name: 'New Zealand', dial_code: '+64' },
  { name: 'Nigeria', dial_code: '+234' },
  { name: 'Norway', dial_code: '+47' },
  { name: 'Oman', dial_code: '+968' },
  { name: 'Pakistan', dial_code: '+92' },
  { name: 'Panama', dial_code: '+507' },
  { name: 'Peru', dial_code: '+51' },
  { name: 'Philippines', dial_code: '+63' },
  { name: 'Poland', dial_code: '+48' },
  { name: 'Portugal', dial_code: '+351' },
  { name: 'Qatar', dial_code: '+974' },
  { name: 'Romania', dial_code: '+40' },
  { name: 'Russia', dial_code: '+7' },
  { name: 'Saudi Arabia', dial_code: '+966' },
  { name: 'Serbia', dial_code: '+381' },
  { name: 'Singapore', dial_code: '+65' },
  { name: 'South Africa', dial_code: '+27' },
  { name: 'South Korea', dial_code: '+82' },
  { name: 'Spain', dial_code: '+34' },
  { name: 'Sri Lanka', dial_code: '+94' },
  { name: 'Sweden', dial_code: '+46' },
  { name: 'Switzerland', dial_code: '+41' },
  { name: 'Thailand', dial_code: '+66' },
  { name: 'Tunisia', dial_code: '+216' },
  { name: 'Turkey', dial_code: '+90' },
  { name: 'Ukraine', dial_code: '+380' },
  { name: 'United Arab Emirates', dial_code: '+971' },
  { name: 'United Kingdom', dial_code: '+44' },
  { name: 'United States', dial_code: '+1' },
  { name: 'Uruguay', dial_code: '+598' },
  { name: 'Uzbekistan', dial_code: '+998' },
  { name: 'Venezuela', dial_code: '+58' },
  { name: 'Vietnam', dial_code: '+84' },
  { name: 'Yemen', dial_code: '+967' },
  { name: 'Zambia', dial_code: '+260' },
  { name: 'Zimbabwe', dial_code: '+263' },
];

const verifyBankDetailsAPI = (bankData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (
        bankData.bankName &&
        bankData.accountHolder &&
        bankData.accountNumber &&
        bankData.routingNumber &&
        bankData.iban &&
        bankData.swiftCode
      ) {
        resolve({ success: true });
      } else {
        reject({ success: false, message: 'Invalid bank details' });
      }
    }, 1500);
  });
};

const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Simple LocalStorage Hook
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });
  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  };
  return [storedValue, setValue];
};

/* --------------------------------
   Dialog: Edit Profile
-------------------------------- */
const EditProfileDialog = ({
  open,
  onClose,
  user,
  onSave,
  onCountryCodeChange,
  onUpdatePhone
}) => {
  const [formData, setFormData] = useState({
    ...user,
    socialLinks: { ...user.socialLinks }
  });
  useEffect(() => {
    setFormData({
      ...user,
      socialLinks: { ...user.socialLinks }
    });
  }, [user]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [name]: value }
    }));
  };
  const handleSave = () => {
    onSave(formData);
    onClose();
  };
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent dividers>
        <TextField fullWidth margin="normal" label="Name" name="name" value={formData.name} onChange={handleChange} />
        <TextField fullWidth margin="normal" label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
        <TextField fullWidth margin="normal" label="Location" name="location" value={formData.location} onChange={handleChange} />
        <TextField fullWidth margin="normal" label="Bio" name="bio" multiline rows={3} value={formData.bio} onChange={handleChange} />
        <TextField fullWidth margin="normal" label="Phone" name="phone" value={formData.phone} onChange={(e) => { handleChange(e); onUpdatePhone(e); }} />
        <Box mt={2} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="body1" sx={{ color: "#fff" }}>Country Code:</Typography>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              borderRadius: "8px",
              overflow: "hidden",
              backgroundColor: "#1E1E1E",
              border: "1px solid #555",
              "&:hover": { border: "1px solid #888" },
            }}
          >
            <select
              value={formData.countryCode}
              name="countryCode"
              onChange={(e) => {
                handleChange(e);
                onCountryCodeChange(e);
              }}
              style={{
                width: "100%",
                padding: "10px",
                background: "transparent",
                color: "#fff",
                border: "none",
                fontSize: "16px",
                appearance: "none",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {countryCodes.map((country, index) => (
                <option key={index} value={country.dial_code} style={{ background: "#1E1E1E", color: "#fff" }}>
                  {country.name} ({country.dial_code})
                </option>
              ))}
            </select>
            <Box
              sx={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              ▼
            </Box>
          </Box>
        </Box>
        <TextField fullWidth margin="normal" label="LinkedIn" name="linkedin" value={formData.socialLinks.linkedin} onChange={handleSocialChange} />
        <TextField fullWidth margin="normal" label="GitHub" name="github" value={formData.socialLinks.github} onChange={handleSocialChange} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save Changes</Button>
      </DialogActions>
    </Dialog>
  );
};

/* --------------------------------
   Dialog: Edit Picture
-------------------------------- */
const EditPictureDialog = ({
  open,
  onClose,
  tempProfilePicture,
  pictureScale,
  setPictureScale,
  saveProfilePicture,
  cancelProfilePictureEdit
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Profile Picture</DialogTitle>
      <DialogContent dividers>
        {tempProfilePicture && (
          <Box display="flex" flexDirection="column" alignItems="center">
            <div
              style={{
                width: '300px',
                height: '300px',
                overflow: 'hidden',
                border: '1px solid #ccc',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={tempProfilePicture}
                alt="Preview"
                style={{
                  transform: `scale(${pictureScale})`,
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain'
                }}
              />
            </div>
            <Typography variant="body2">Adjust Size:</Typography>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pictureScale}
              onChange={(e) => setPictureScale(Number(e.target.value))}
              style={{ width: '80%', marginTop: '8px' }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={cancelProfilePictureEdit}>Cancel</Button>
        <Button variant="contained" onClick={saveProfilePicture}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

/* --------------------------------
   Dialog: Premium AI Tools
-------------------------------- */
const PremiumAIDialog = ({ open, onClose, user }) => {
  const computePremiumAnalysis = () => {
    let analysis = '';
    analysis += user.profilePicture.includes('placeholder')
      ? 'Consider uploading a custom profile picture. '
      : 'Your profile picture looks good. ';
    analysis += user.isEmailVerified ? 'Email verified. ' : 'Please verify your email. ';
    analysis += user.isPhoneVerified ? 'Phone verified. ' : 'Please verify your phone. ';
    analysis += user.skills.length < 3
      ? 'Add more skills to showcase your expertise. '
      : 'Your skill set looks solid. ';
    analysis += user.projects.length === 0
      ? 'Add some projects to show your work.'
      : 'You have some nice projects!';
    return analysis;
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Premium AI Toolkit</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1">{computePremiumAnalysis()}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

/* --------------------------------
   Dialog: Change Password
-------------------------------- */
const ChangePasswordDialog = ({ open, onClose, onChangePassword }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSave = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    onChangePassword({ currentPassword, newPassword });
    onClose();
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent dividers>
        {passwordError && <Typography color="error">{passwordError}</Typography>}
        <TextField fullWidth margin="normal" label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <TextField fullWidth margin="normal" label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <TextField fullWidth margin="normal" label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Change Password</Button>
      </DialogActions>
    </Dialog>
  );
};

/* --------------------------------
   Main Profile Component
-------------------------------- */
const Profile = () => {
  // Responsive adjustments
  const isMobile = useMediaQuery('(max-width:768px)');

  const [user, setUser] = useLocalStorage('profile', {
    name: 'John Doe',
    email: 'johndoe@example.com',
    phone: '5551234567',
    countryCode: '+1',
    role: 'Freelancer',
    profilePicture: 'https://via.placeholder.com/150',
    bio: 'Passionate freelancer with a love for tech and design.',
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
    subscriptionStatus: 'Premium',
    isVerified: true,
    isEmailVerified: false,
    isPhoneVerified: false,
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    routingNumber: '',
    iban: '',
    swiftCode: '',
    isBankVerified: false,
    // For simulation purposes only:
    password: 'password123'
  });

  // Additional states
  const [newSkill, setNewSkill] = useState('');
  const [newProject, setNewProject] = useState({ title: '', description: '', tags: [] });
  const [newTag, setNewTag] = useState('');
  const [tagList, setTagList] = useState([]);
  const [isEditingBio, setIsEditingBio] = useState(false);

  // Picture states
  const [profilePicture, setProfilePicture] = useState(user.profilePicture);
  const [isEditingPicture, setIsEditingPicture] = useState(false);
  const [tempProfilePicture, setTempProfilePicture] = useState(null);
  const [pictureScale, setPictureScale] = useState(1);
  const fileInputRef = useRef(null);

  // Verification states
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [emailCodeInput, setEmailCodeInput] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [phoneCodeInput, setPhoneCodeInput] = useState('');
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);

  // Bank Dialog
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [iban, setIban] = useState('');
  const [swiftCode, setSwiftCode] = useState('');

  // Social
  const [isGitHubConnected, setIsGitHubConnected] = useState(false);
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);

  // Dialog: Edit Profile
  const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);

  // Dialog: Change Password (declared only once)
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);

  // AI analysis
  const [aiAnalysis, setAiAnalysis] = useState('');
  const analyzeProfile = useCallback(() => {
    const activeSkills = user.skills.length;
    const projectCount = user.projects.length;
    const analysis = `Your profile shows ${activeSkills} skills and ${projectCount} projects. Consider updating your bio and social links for a stronger profile presence.`;
    setAiAnalysis(analysis);
  }, [user.skills.length, user.projects.length]);

  // Premium AI Dialog
  const [premiumAIDialogOpen, setPremiumAIDialogOpen] = useState(false);

  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [error, setError] = useState('');

  /* --------------------------
     Profile Edit & Save
  -------------------------- */
  const handleSaveProfileEdits = useCallback(
    (formData) => {
      setUser((prev) => ({
        ...prev,
        ...formData,
        socialLinks: { ...formData.socialLinks }
      }));
      setSnackbarMsg('Profile updated successfully!');
      setSnackbarOpen(true);
    },
    [setUser]
  );

  /* --------------------------
     Email Verification
  -------------------------- */
  const sendEmailVerification = useCallback(() => {
    const code = generateVerificationCode();
    setEmailVerificationCode(code);
    setIsVerifyingEmail(true);
    alert(`Verification code sent to ${user.email} (Simulated Code: ${code})`);
  }, [user.email]);

  const verifyEmailCode = useCallback(() => {
    if (emailCodeInput === emailVerificationCode) {
      setUser((prev) => ({ ...prev, isEmailVerified: true }));
      setIsVerifyingEmail(false);
      setEmailVerificationCode('');
      setEmailCodeInput('');
      alert('Email verified successfully!');
    } else {
      alert('Incorrect verification code. Please try again.');
    }
  }, [emailCodeInput, emailVerificationCode, setUser]);

  /* --------------------------
     Phone Verification
  -------------------------- */
  const sendPhoneVerification = useCallback(() => {
    const code = generateVerificationCode();
    setPhoneVerificationCode(code);
    setIsVerifyingPhone(true);
    alert(`Verification code sent to ${user.countryCode} ${user.phone} (Simulated Code: ${code})`);
  }, [user.countryCode, user.phone]);

  const verifyPhoneCode = useCallback(() => {
    if (phoneCodeInput === phoneVerificationCode) {
      setUser((prev) => ({ ...prev, isPhoneVerified: true }));
      setIsVerifyingPhone(false);
      setPhoneVerificationCode('');
      setPhoneCodeInput('');
      alert('Phone number verified successfully!');
    } else {
      alert('Incorrect verification code. Please try again.');
    }
  }, [phoneCodeInput, phoneVerificationCode, setUser]);

  /* --------------------------
     Bank Details Verification
  -------------------------- */
  const handleVerifyBankDetails = useCallback(() => {
    if (
      !bankName.trim() ||
      !accountHolder.trim() ||
      !accountNumber.trim() ||
      !routingNumber.trim() ||
      !iban.trim() ||
      !swiftCode.trim()
    ) {
      setError('Please fill out all bank details.');
      return;
    }
    verifyBankDetailsAPI({
      bankName: bankName.trim(),
      accountHolder: accountHolder.trim(),
      accountNumber: accountNumber.trim(),
      routingNumber: routingNumber.trim(),
      iban: iban.trim(),
      swiftCode: swiftCode.trim()
    })
      .then(() => {
        setUser((prev) => ({
          ...prev,
          bankName: bankName.trim(),
          accountHolder: accountHolder.trim(),
          accountNumber: accountNumber.trim(),
          routingNumber: routingNumber.trim(),
          iban: iban.trim(),
          swiftCode: swiftCode.trim(),
          isBankVerified: true
        }));
        setBankDialogOpen(false);
        setSnackbarMsg('Bank details verified successfully!');
        setSnackbarOpen(true);
      })
      .catch((err) => {
        setError(err.message || 'Bank verification failed.');
      });
  }, [bankName, accountHolder, accountNumber, routingNumber, iban, swiftCode, setUser]);

  /* --------------------------
     Social & Additional Features
  -------------------------- */
  const connectGitHub = useCallback(() => {
    setIsGitHubConnected(true);
    alert('Connected with GitHub successfully!');
  }, []);

  const connectLinkedIn = useCallback(() => {
    setIsLinkedInConnected(true);
    alert('Connected with LinkedIn successfully!');
  }, []);

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !tagList.includes(newTag.trim())) {
      setTagList((prev) => [...prev, newTag.trim()]);
      setNewTag('');
    } else {
      alert('Please enter a valid tag or avoid duplicates.');
    }
  }, [newTag, tagList]);

  const handleRemoveTag = useCallback((index) => {
    if (window.confirm('Are you sure you want to remove this tag?')) {
      setTagList((prev) => prev.filter((_, i) => i !== index));
    }
  }, []);

  const handleAddSkill = useCallback(() => {
    if (newSkill.trim() && !user.skills.includes(newSkill.trim())) {
      setUser((prev) => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
    } else {
      alert('Skill is either empty or already exists!');
    }
  }, [newSkill, user.skills, setUser]);

  const handleRemoveSkill = useCallback((index) => {
    if (window.confirm('Are you sure you want to remove this skill?')) {
      setUser((prev) => ({
        ...prev,
        skills: prev.skills.filter((_, i) => i !== index)
      }));
    }
  }, [setUser]);

  const handleAddProject = useCallback(() => {
    if (newProject.title && newProject.description) {
      setUser((prev) => ({
        ...prev,
        projects: [
          ...prev.projects,
          { id: Date.now(), title: newProject.title, description: newProject.description }
        ]
      }));
      setNewProject({ title: '', description: '', tags: [] });
    } else {
      alert('Both title and description must be filled out.');
    }
  }, [newProject, setUser]);

  const handleDeleteProject = useCallback((id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setUser((prev) => ({
        ...prev,
        projects: prev.projects.filter((project) => project.id !== id)
      }));
    }
  }, [setUser]);

  const handleEditProject = useCallback((id) => {
    const updatedProject = user.projects.find((proj) => proj.id === id);
    const title = prompt('Edit Project Title:', updatedProject.title);
    const description = prompt('Edit Project Description:', updatedProject.description);
    if (title && description) {
      setUser((prev) => ({
        ...prev,
        projects: prev.projects.map((proj) =>
          proj.id === id ? { ...proj, title, description } : proj
        )
      }));
    }
  }, [user.projects, setUser]);

  const handleUpdatePhone = useCallback((e) => {
    setUser((prev) => ({ ...prev, phone: e.target.value }));
  }, [setUser]);

  const handleCountryCodeChange = useCallback((e) => {
    setUser((prev) => ({ ...prev, countryCode: e.target.value }));
  }, [setUser]);

  const handlePictureUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfilePicture(reader.result);
        setIsEditingPicture(true);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const triggerPictureUpload = useCallback(() => {
    fileInputRef.current.click();
  }, []);

  // Save profile picture using a canvas to apply scaling
  const saveProfilePicture = useCallback(() => {
    if (tempProfilePicture) {
      const image = new Image();
      image.src = tempProfilePicture;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const width = image.width * pictureScale;
        const height = image.height * pictureScale;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);
        const scaledDataUrl = canvas.toDataURL();
        setProfilePicture(scaledDataUrl);
        setUser((prev) => ({ ...prev, profilePicture: scaledDataUrl }));
        setIsEditingPicture(false);
        setTempProfilePicture(null);
        setPictureScale(1);
        alert('Profile picture updated successfully!');
      };
    }
  }, [tempProfilePicture, pictureScale, setUser]);

  const cancelProfilePictureEdit = useCallback(() => {
    setIsEditingPicture(false);
    setTempProfilePicture(null);
    setPictureScale(1);
  }, []);

  const removeProfilePicture = useCallback(() => {
    if (window.confirm('Are you sure you want to remove your profile picture?')) {
      setProfilePicture('https://via.placeholder.com/150');
      setUser((prev) => ({ ...prev, profilePicture: 'https://via.placeholder.com/150' }));
    }
  }, [setUser]);

  const handleUpdateSocialLinks = useCallback(
    (platform) => {
      const currentLink = user.socialLinks[platform];
      const newLink = prompt(`Enter new ${platform} URL:`, currentLink);
      if (newLink) {
        setUser((prev) => ({
          ...prev,
          socialLinks: { ...prev.socialLinks, [platform]: newLink }
        }));
      }
    },
    [user.socialLinks, setUser]
  );

  /* --------------------------
     Dialog: Change Password
  -------------------------- */
  const handleChangePassword = useCallback(({ currentPassword, newPassword }) => {
    if (currentPassword !== user.password) {
      alert('Current password is incorrect.');
      return;
    }
    setUser((prev) => ({ ...prev, password: newPassword }));
    alert('Password updated successfully!');
  }, [user.password, setUser]);

  /* --------------------------
     Extra: Log Out & Copy Profile Link
  -------------------------- */
  const handleLogout = useCallback(() => {
    if (window.confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('profile');
      alert('Logged out successfully!');
      // Redirect to login if needed.
    }
  }, []);

  const handleCopyProfileLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Profile link copied to clipboard!');
    });
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="profile-page">
      <Card>
        <CardContent>
          {/* Profile Picture Section */}
          <div>
            <img
              src={profilePicture}
              alt="Profile"
              style={{ maxWidth: isMobile ? '100px' : '150px', borderRadius: '50%' }}
            />
            <div style={{ marginTop: '8px' }}>
              <Button onClick={triggerPictureUpload}>Update Picture</Button>
              <Button onClick={removeProfilePicture}>Remove Picture</Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePictureUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* Picture Edit Dialog */}
          {isEditingPicture && (
            <EditPictureDialog
              open={isEditingPicture}
              onClose={cancelProfilePictureEdit}
              tempProfilePicture={tempProfilePicture}
              pictureScale={pictureScale}
              setPictureScale={setPictureScale}
              saveProfilePicture={saveProfilePicture}
              cancelProfilePictureEdit={cancelProfilePictureEdit}
            />
          )}

          <Typography variant="h5" style={{ marginTop: '16px' }}>
            {user.name}
          </Typography>
          <p>{user.role}</p>
          <p>{user.location}</p>
          {user.isVerified && <span>Verified</span>}
          <p>Subscription Status: {user.subscriptionStatus}</p>
          <Box mt={1}>
            <Button variant="outlined" size="small" onClick={handleCopyProfileLink}>
              Copy Profile Link
            </Button>{' '}
            <Button variant="outlined" size="small" onClick={handleLogout}>
              Log Out
            </Button>
          </Box>

          {/* Email & Phone Verification */}
          <div style={{ marginTop: '16px' }}>
            <p>
              Email: {user.email}{' '}
              {user.isEmailVerified ? (
                <span>(Verified)</span>
              ) : (
                <>
                  {!isVerifyingEmail ? (
                    <Button onClick={sendEmailVerification} size="small">
                      Send Code
                    </Button>
                  ) : (
                    <Box mt={1}>
                      <TextField
                        size="small"
                        value={emailCodeInput}
                        onChange={(e) => setEmailCodeInput(e.target.value)}
                        placeholder="Enter code"
                      />
                      <Button onClick={verifyEmailCode} size="small">
                        Verify
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </p>
            <p>
              Phone: {user.countryCode} {user.phone}{' '}
              {user.isPhoneVerified ? (
                <span>(Verified)</span>
              ) : (
                <>
                  {!isVerifyingPhone ? (
                    <Button onClick={sendPhoneVerification} size="small">
                      Send Code
                    </Button>
                  ) : (
                    <Box mt={1}>
                      <TextField
                        size="small"
                        value={phoneCodeInput}
                        onChange={(e) => setPhoneCodeInput(e.target.value)}
                        placeholder="Enter code"
                      />
                      <Button onClick={verifyPhoneCode} size="small">
                        Verify
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </p>
            <p>
              <a href={`mailto:${user.email}`}>Contact Me</a>
            </p>
          </div>

          {/* Social Links */}
          <div style={{ marginTop: '16px' }}>
            {isLinkedInConnected ? (
              <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                View LinkedIn Profile
              </a>
            ) : (
              <Button onClick={connectLinkedIn}>Connect LinkedIn</Button>
            )}{' '}
            {isGitHubConnected ? (
              <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer">
                View GitHub Profile
              </a>
            ) : (
              <Button onClick={connectGitHub}>Connect GitHub</Button>
            )}
            <div style={{ marginTop: '8px' }}>
              <Button onClick={() => handleUpdateSocialLinks('linkedin')} size="small">
                Edit LinkedIn
              </Button>
              <Button onClick={() => handleUpdateSocialLinks('github')} size="small">
                Edit GitHub
              </Button>
            </div>
          </div>
        </CardContent>
        <CardActions>
          <Button variant="contained" onClick={() => setEditProfileDialogOpen(true)}>
            Edit Profile
          </Button>
          <Button variant="contained" onClick={() => setChangePasswordDialogOpen(true)}>
            Change Password
          </Button>
        </CardActions>
      </Card>

      {/* Bank Details */}
      <Box mt={4}>
        <Typography variant="h6">Bank Details</Typography>
        {user.isBankVerified ? (
          <div>
            <p>Bank Name: {user.bankName}</p>
            <p>Account Holder: {user.accountHolder}</p>
            <p>Account Number: ****{user.accountNumber.slice(-4)}</p>
            <p>Routing Number: ****{user.routingNumber.slice(-4)}</p>
            <p>IBAN: {user.iban ? `****${user.iban.slice(-4)}` : 'N/A'}</p>
            <p>SWIFT Code: {user.swiftCode ? user.swiftCode : 'N/A'}</p>
            <Typography variant="body2">(Verified)</Typography>
          </div>
        ) : (
          <div>
            <p>Bank details not verified.</p>
            <Button onClick={() => setBankDialogOpen(true)}>Verify Bank Details</Button>
          </div>
        )}
      </Box>

      {/* Tags */}
      <Box mt={4}>
        <TextField label="Add a tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
        <Button onClick={handleAddTag} style={{ marginLeft: '8px' }}>
          Add Tag
        </Button>
        {tagList.length > 0 ? (
          <ul style={{ marginTop: '8px' }}>
            {tagList.map((tag, index) => (
              <li key={index}>
                {tag}{' '}
                <Button onClick={() => handleRemoveTag(index)} size="small">
                  &times;
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ marginTop: '8px' }}>No tags added yet.</p>
        )}
      </Box>

      {/* Bio Section */}
      <Box mt={4}>
        <Typography variant="h6">About Me</Typography>
        {isEditingBio ? (
          <TextField
            multiline
            rows={4}
            fullWidth
            value={user.bio}
            onChange={(e) => setUser({ ...user, bio: e.target.value })}
            onBlur={() => setIsEditingBio(false)}
          />
        ) : (
          <p onClick={() => setIsEditingBio(true)} style={{ cursor: 'pointer' }}>
            {user.bio}
          </p>
        )}
      </Box>

      {/* Skills */}
      <Box mt={4}>
        <Typography variant="h6">Skills</Typography>
        <ul>
          {user.skills.map((skill, index) => (
            <li key={index}>
              {skill}{' '}
              <Button onClick={() => handleRemoveSkill(index)} size="small">
                Remove
              </Button>
            </li>
          ))}
        </ul>
        <TextField label="New Skill" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} />
        <Button onClick={handleAddSkill} style={{ marginLeft: '8px' }}>
          Add Skill
        </Button>
      </Box>

      {/* Projects */}
      <Box mt={4}>
        <Typography variant="h6">Projects</Typography>
        {user.projects.map((project) => (
          <div key={project.id} style={{ marginTop: '8px' }}>
            <strong>{project.title}</strong>
            <p>{project.description}</p>
            <Button onClick={() => handleEditProject(project.id)} size="small">
              Edit
            </Button>
            <Button onClick={() => handleDeleteProject(project.id)} size="small">
              Delete
            </Button>
          </div>
        ))}
        <Box mt={2}>
          <TextField
            label="Project Title"
            value={newProject.title}
            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
          />
          <TextField
            label="Project Description"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            multiline
            rows={2}
            style={{ display: 'block', marginTop: '8px' }}
          />
          <Button onClick={handleAddProject} style={{ marginTop: '8px' }}>
            Add Project
          </Button>
        </Box>
      </Box>

      {/* Basic AI Analysis */}
      <Box mt={4}>
        <Typography variant="h6">AI Profile Analyzer</Typography>
        <Button variant="contained" onClick={analyzeProfile}>
          Analyze Profile
        </Button>
        {aiAnalysis && (
          <Box mt={2}>
            <Typography variant="body1">{aiAnalysis}</Typography>
          </Box>
        )}
        <Box mt={2}>
          <Button variant="outlined" onClick={() => setPremiumAIDialogOpen(true)}>
            Premium AI Tools
          </Button>
        </Box>
      </Box>

      {/* Additional Actions: Change Password */}
      <Box mt={4} display="flex" gap={2} flexWrap="wrap">
        <Button variant="contained" onClick={() => setChangePasswordDialogOpen(true)}>
          Change Password
        </Button>
      </Box>

      {/* Dialog: Edit Profile */}
      <EditProfileDialog
        open={editProfileDialogOpen}
        onClose={() => setEditProfileDialogOpen(false)}
        user={user}
        onSave={handleSaveProfileEdits}
        onCountryCodeChange={handleCountryCodeChange}
        onUpdatePhone={handleUpdatePhone}
      />

      {/* Dialog: Bank Details */}
      <Dialog open={bankDialogOpen} onClose={() => setBankDialogOpen(false)}>
        <DialogTitle>Verify Bank Details</DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth margin="normal" label="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
          <TextField fullWidth margin="normal" label="Account Holder Name" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
          <TextField fullWidth margin="normal" label="Account Number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
          <TextField fullWidth margin="normal" label="Routing Number" value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)} />
          <TextField fullWidth margin="normal" label="IBAN" value={iban} onChange={(e) => setIban(e.target.value)} />
          <TextField fullWidth margin="normal" label="SWIFT Code" value={swiftCode} onChange={(e) => setSwiftCode(e.target.value)} />
          <Typography variant="body2" style={{ marginTop: '8px' }}>
            (In a real app, bank details would be verified securely via an API.)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBankDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleVerifyBankDetails}>
            Verify
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Premium AI Tools */}
      <PremiumAIDialog open={premiumAIDialogOpen} onClose={() => setPremiumAIDialogOpen(false)} user={user} />

      {/* Dialog: Change Password */}
      <ChangePasswordDialog
        open={changePasswordDialogOpen}
        onClose={() => setChangePasswordDialogOpen(false)}
        onChangePassword={handleChangePassword}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        message={snackbarMsg || 'Action successful'}
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

      {/* Footer */}
      <Box mt={8} textAlign="center">
        <Typography variant="caption">© 2025 Freelancer Assistant. All rights reserved.</Typography>
      </Box>
    </div>
  );
};

export default Profile;
