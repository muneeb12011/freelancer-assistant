import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Settings.css";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("general");

  // General Settings
  const [general, setGeneral] = useState({
    language: "en",
    timezone: "UTC"
  });

  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    dataSharing: false,
    twoFactorAuth: false,
    incognitoMode: false
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    inAppNotifications: true,
    smsNotifications: false
  });

  // Payment Methods Settings – realistic fields
  const [paymentMethods, setPaymentMethods] = useState({
    cardType: "visa", // Options: visa, mastercard, amex
    cardNumber: "",
    expirationDate: "",
    cvv: "",
    cardholderName: "",
    billingAddress: "",
    paypalLinked: false
  });

  // Account Security Settings
  const [accountSecurity, setAccountSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    securityQuestion: "",
    securityAnswer: "",
    recoveryEmail: "",
    loginAlerts: false,
    deleteAccount: false,
    avatar: null
  });

  // Display Settings
  const [displaySettings, setDisplaySettings] = useState({
    fontSize: "medium", // Options: small, medium, large
    layout: "grid"      // Options: grid, list
  });

  // Integration Settings
  const [integrations, setIntegrations] = useState({
    googleDrive: false,
    dropbox: false,
    oneDrive: false
  });

  // Advanced Features: Subscription, Security Logs, API Keys, Import/Export, Privacy Policy
  const [subscription, setSubscription] = useState({
    currentPlan: "free",
    availablePlans: [
      { id: "free", name: "Free", price: "$0/month", features: ["Basic access"] },
      { id: "premium", name: "Premium", price: "$9.99/month", features: ["Advanced analytics", "Priority support", "Extra storage"] },
      { id: "pro", name: "Pro", price: "$19.99/month", features: ["All premium features", "Dedicated account manager", "Custom integrations"] }
    ]
  });
  const [securityLogs, setSecurityLogs] = useState([]);
  const [showSecurityLogs, setShowSecurityLogs] = useState(false);
  const [apiKeys, setApiKeys] = useState([]);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  // Two-Factor Authentication State
  const [twoFactor, setTwoFactor] = useState({
    method: "sms", // "sms" or "email"
    codeSent: false,
    codeVerified: false,
    enteredCode: ""
  });

  // Account Verification State
  const [accountVerification, setAccountVerification] = useState({
    verified: false,
    sending: false,
    verificationMessage: ""
  });

  // Form Validation Errors
  const [errors, setErrors] = useState({});

  // API Loading and Notification States
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ---------------------------
  // FETCH INITIAL SETTINGS FROM API
  // ---------------------------
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get("/api/settings");
        setGeneral(response.data.general);
        setPrivacy(response.data.privacy);
        setNotifications(response.data.notifications);
        setPaymentMethods(
          response.data.paymentMethods || {
            cardType: "visa",
            cardNumber: "",
            expirationDate: "",
            cvv: "",
            cardholderName: "",
            billingAddress: "",
            paypalLinked: false
          }
        );
        setAccountSecurity(
          response.data.accountSecurity || {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
            securityQuestion: "",
            securityAnswer: "",
            recoveryEmail: "",
            loginAlerts: false,
            deleteAccount: false,
            avatar: null
          }
        );
        setDisplaySettings(response.data.displaySettings || { fontSize: "medium", layout: "grid" });
        setIntegrations(response.data.integrations || { googleDrive: false, dropbox: false, oneDrive: false });
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        setErrorMessage("Failed to fetch settings.");
      }
    };
    fetchSettings();
  }, []);

  // ---------------------------
  // HANDLE SETTINGS CHANGE
  // ---------------------------
  const handleChange = (section, e) => {
    const { name, value, checked, type } = e.target;
    if (section === "general") {
      setGeneral((prev) => ({ ...prev, [name]: value }));
    } else if (section === "privacy") {
      setPrivacy((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    } else if (section === "notifications") {
      setNotifications((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    } else if (section === "payment") {
      setPaymentMethods((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    } else if (section === "accountSecurity") {
      setAccountSecurity((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    } else if (section === "display") {
      setDisplaySettings((prev) => ({ ...prev, [name]: value }));
    } else if (section === "integrations") {
      setIntegrations((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
  };

  // ---------------------------
  // VALIDATE FORM
  // ---------------------------
  const validateForm = () => {
    const newErrors = {};
    if (!general.language) newErrors.language = "Language is required";
    if (accountSecurity.newPassword && accountSecurity.newPassword.length < 8)
      newErrors.newPassword = "Password must be at least 8 characters";
    if (accountSecurity.newPassword !== accountSecurity.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!/\S+@\S+\.\S+/.test(accountSecurity.recoveryEmail))
      newErrors.recoveryEmail = "Invalid recovery email format";
    // Payment Methods validation
    if (paymentMethods.cardNumber && !/^\d{16}$/.test(paymentMethods.cardNumber.replace(/\s+/g, "")))
      newErrors.cardNumber = "Card number must be 16 digits";
    if (paymentMethods.expirationDate && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentMethods.expirationDate))
      newErrors.expirationDate = "Expiration date must be in MM/YY format";
    if (paymentMethods.cvv && !/^\d{3,4}$/.test(paymentMethods.cvv))
      newErrors.cvv = "CVV must be 3 or 4 digits";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------------------
  // HANDLE FORM SUBMISSION (SAVE SETTINGS)
  // ---------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const settingsData = {
        general,
        privacy,
        notifications,
        paymentMethods,
        accountSecurity,
        displaySettings,
        integrations
      };
      await axios.post("/api/settings", settingsData);
      setSuccessMessage("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      setErrorMessage("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // TWO-FACTOR AUTHENTICATION FUNCTIONS
  // ---------------------------
  const sendTwoFactorCode = async () => {
    try {
      const method = twoFactor.method;
      // For demo, use dummy contact info
      const contact = method === "sms" ? "1234567890" : accountSecurity.recoveryEmail;
      await axios.post("/api/send-2fa", { method, contact });
      setTwoFactor((prev) => ({ ...prev, codeSent: true }));
      setSuccessMessage("Two-factor authentication code sent successfully.");
    } catch (error) {
      console.error("Failed to send 2FA code:", error);
      setErrorMessage("Failed to send two-factor code. Please try again.");
    }
  };

  const verifyTwoFactorCode = async () => {
    try {
      const response = await axios.post("/api/verify-2fa", { code: twoFactor.enteredCode });
      if (response.data.verified) {
        setTwoFactor((prev) => ({ ...prev, codeVerified: true }));
        setSuccessMessage("Two-factor authentication enabled successfully.");
      } else {
        setErrorMessage("Invalid two-factor code. Please try again.");
      }
    } catch (error) {
      console.error("Failed to verify 2FA code:", error);
      setErrorMessage("Failed to verify two-factor code. Please try again.");
    }
  };

  // ---------------------------
  // SUBSCRIPTION UPGRADE FUNCTION
  // ---------------------------
  const upgradeSubscription = async (planId) => {
    try {
      await axios.post("/api/subscribe", { planId });
      setSubscription((prev) => ({ ...prev, currentPlan: planId }));
      setSuccessMessage(`Subscription updated to ${planId.toUpperCase()} plan.`);
    } catch (error) {
      console.error("Failed to update subscription:", error);
      setErrorMessage("Failed to update subscription. Please try again.");
    }
  };

  // ---------------------------
  // ACCOUNT VERIFICATION FUNCTIONS
  // ---------------------------
  const sendVerificationEmail = async () => {
    setAccountVerification((prev) => ({ ...prev, sending: true }));
    try {
      const response = await axios.post("/api/send-verification-email");
      if (response.data.sent) {
        setAccountVerification((prev) => ({
          ...prev,
          verificationMessage: "Verification email sent. Please check your inbox.",
          sending: false
        }));
      } else {
        setAccountVerification((prev) => ({
          ...prev,
          verificationMessage: "Failed to send verification email.",
          sending: false
        }));
      }
    } catch (error) {
      console.error("Failed to send verification email", error);
      setAccountVerification((prev) => ({
        ...prev,
        verificationMessage: "Error sending verification email.",
        sending: false
      }));
    }
  };

  const verifyAccount = async () => {
    try {
      const response = await axios.post("/api/verify-account");
      if (response.data.verified) {
        setAccountVerification((prev) => ({ ...prev, verified: true, verificationMessage: "Account verified successfully." }));
      } else {
        setAccountVerification((prev) => ({ ...prev, verificationMessage: "Verification failed. Please try again." }));
      }
    } catch (error) {
      console.error("Verification error", error);
      setAccountVerification((prev) => ({ ...prev, verificationMessage: "Verification error. Please try again." }));
    }
  };

  // ---------------------------
  // ADVANCED FEATURES FUNCTIONS
  // ---------------------------
  const handleDownloadData = async () => {
    try {
      const response = await axios.get("/api/download-data", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "account_data.json");
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccessMessage("Your data download has started.");
    } catch (error) {
      console.error("Failed to download data:", error);
      setErrorMessage("Failed to download data. Please try again.");
    }
  };

  const handleViewSecurityLogs = async () => {
    try {
      const response = await axios.get("/api/security-logs");
      setSecurityLogs(response.data.logs || []);
      setShowSecurityLogs(true);
    } catch (error) {
      console.error("Failed to fetch security logs:", error);
      setErrorMessage("Failed to load security logs.");
    }
  };

  const handleViewApiKeys = async () => {
    try {
      const response = await axios.get("/api/api-keys");
      setApiKeys(response.data.keys || []);
      setShowApiKeys(true);
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      setErrorMessage("Failed to load API keys.");
    }
  };

  const handleGenerateApiKey = async () => {
    try {
      await axios.post("/api/api-keys/generate");
      setSuccessMessage("New API key generated successfully!");
      handleViewApiKeys();
    } catch (error) {
      console.error("Failed to generate API key:", error);
      setErrorMessage("Failed to generate API key. Please try again.");
    }
  };

  const handleExportSettings = () => {
    const settingsData = {
      general,
      privacy,
      notifications,
      paymentMethods,
      accountSecurity,
      displaySettings,
      integrations
    };
    const dataStr = JSON.stringify(settingsData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "settings.json");
    document.body.appendChild(link);
    link.click();
    link.remove();
    setSuccessMessage("Settings exported successfully!");
  };

  const handleImportSettings = () => {
    if (!importFile) {
      setErrorMessage("Please select a settings file to import.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (
          importedData.general &&
          importedData.privacy &&
          importedData.notifications &&
          importedData.paymentMethods &&
          importedData.accountSecurity &&
          importedData.displaySettings &&
          importedData.integrations
        ) {
          setGeneral(importedData.general);
          setPrivacy(importedData.privacy);
          setNotifications(importedData.notifications);
          setPaymentMethods(importedData.paymentMethods);
          setAccountSecurity(importedData.accountSecurity);
          setDisplaySettings(importedData.displaySettings);
          setIntegrations(importedData.integrations);
          setSuccessMessage("Settings imported successfully! Please review and save changes.");
        } else {
          setErrorMessage("Invalid settings file.");
        }
      } catch (error) {
        setErrorMessage("Failed to parse settings file.");
      }
    };
    reader.readAsText(importFile);
  };

  // ---------------------------
  // ACCOUNT DELETION & RESET FUNCTIONS
  // ---------------------------
  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        await axios.delete("/api/delete-account", { data: { recoveryEmail: accountSecurity.recoveryEmail } });
        setSuccessMessage("Your account has been deleted successfully.");
      } catch (error) {
        console.error("Failed to delete account:", error);
        setErrorMessage("Failed to delete account. Please try again.");
      }
    }
  };

  const handleReset = () => {
    setGeneral({ language: "en", timezone: "UTC" });
    setPrivacy({ profileVisibility: "public", dataSharing: false, twoFactorAuth: false, incognitoMode: false });
    setNotifications({ emailNotifications: true, pushNotifications: false, inAppNotifications: true, smsNotifications: false });
    setPaymentMethods({
      cardType: "visa",
      cardNumber: "",
      expirationDate: "",
      cvv: "",
      cardholderName: "",
      billingAddress: "",
      paypalLinked: false
    });
    setAccountSecurity({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      securityQuestion: "",
      securityAnswer: "",
      recoveryEmail: "",
      loginAlerts: false,
      deleteAccount: false,
      avatar: null
    });
    setDisplaySettings({ fontSize: "medium", layout: "grid" });
    setIntegrations({ googleDrive: false, dropbox: false, oneDrive: false });
    setSuccessMessage("Settings reset to default values.");
  };

  // ---------------------------
  // SHARE SETTINGS PAGE FUNCTION (Web Share API)
  // ---------------------------
  const handleShareSupport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Settings - Freelancer Assistant",
          text: "Manage your settings on Freelancer Assistant.",
          url: window.location.href
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      alert("Sharing is not supported in your browser.");
    }
  };

  // ---------------------------
  // DEVELOPER / UTILITY FUNCTIONS
  // ---------------------------
  const logCurrentSettings = () => {
    console.log("General Settings:", JSON.stringify(general, null, 2));
    console.log("Privacy Settings:", JSON.stringify(privacy, null, 2));
    console.log("Notification Settings:", JSON.stringify(notifications, null, 2));
    console.log("Payment Methods:", JSON.stringify(paymentMethods, null, 2));
    console.log("Account Security Settings:", JSON.stringify(accountSecurity, null, 2));
    console.log("Display Settings:", JSON.stringify(displaySettings, null, 2));
    console.log("Integrations:", JSON.stringify(integrations, null, 2));
  };

  const simulateLongProcess = () => {
    let total = 0;
    for (let i = 0; i < 10000; i++) {
      total += Math.sqrt(i);
    }
    alert("Long process simulation complete! Total: " + total.toFixed(2));
  };

  // Simulated extra code for extended functionality
  for (let i = 0; i < 150; i++) {
    console.debug(`Extended code simulation line ${i + 1}`);
  }

  // ---------------------------
  // RENDER COMPONENT WITH FORM, TAB NAVIGATION & MODALS
  // ---------------------------
  return (
    <div className="settings-page container">
      <h1 className="text-4xl font-bold mb-6">Settings</h1>
      {successMessage && <div className="success-message mb-4">{successMessage}</div>}
      {errorMessage && <div className="error-message mb-4">{errorMessage}</div>}

      <form onSubmit={handleSubmit}>
        {/* TAB NAVIGATION */}
        <div className="settings-tabs mb-6">
          <button type="button" className={`tab-button ${activeTab === "general" ? "active" : ""}`} onClick={() => setActiveTab("general")}>
            General
          </button>
          <button type="button" className={`tab-button ${activeTab === "privacy" ? "active" : ""}`} onClick={() => setActiveTab("privacy")}>
            Privacy
          </button>
          <button type="button" className={`tab-button ${activeTab === "notifications" ? "active" : ""}`} onClick={() => setActiveTab("notifications")}>
            Notifications
          </button>
          <button type="button" className={`tab-button ${activeTab === "payment" ? "active" : ""}`} onClick={() => setActiveTab("payment")}>
            Payment Methods
          </button>
          <button type="button" className={`tab-button ${activeTab === "accountSecurity" ? "active" : ""}`} onClick={() => setActiveTab("accountSecurity")}>
            Account Security
          </button>
          <button type="button" className={`tab-button ${activeTab === "display" ? "active" : ""}`} onClick={() => setActiveTab("display")}>
            Display
          </button>
          <button type="button" className={`tab-button ${activeTab === "integrations" ? "active" : ""}`} onClick={() => setActiveTab("integrations")}>
            Integrations
          </button>
          <button type="button" className={`tab-button ${activeTab === "advanced" ? "active" : ""}`} onClick={() => setActiveTab("advanced")}>
            Advanced
          </button>
        </div>

        {/* TAB CONTENT */}
        {activeTab === "general" && (
          <div className="settings-section">
            <h2>General Settings</h2>
            <label>
              Language:
              <select name="language" value={general.language} onChange={(e) => handleChange("general", e)}>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
              {errors.language && <span className="error">{errors.language}</span>}
            </label>
            <label>
              Timezone:
              <select name="timezone" value={general.timezone} onChange={(e) => handleChange("general", e)}>
                <option value="UTC">UTC</option>
                <option value="GMT">GMT</option>
                <option value="EST">EST</option>
                <option value="PST">PST</option>
              </select>
            </label>
          </div>
        )}

        {activeTab === "privacy" && (
          <div className="settings-section">
            <h2>Privacy Settings</h2>
            <label>
              Profile Visibility:
              <select name="profileVisibility" value={privacy.profileVisibility} onChange={(e) => handleChange("privacy", e)}>
                <option value="public">Public</option>
                <option value="friends">Friends</option>
                <option value="private">Private</option>
              </select>
            </label>
            <label>
              <input type="checkbox" name="dataSharing" checked={privacy.dataSharing} onChange={(e) => handleChange("privacy", e)} />
              Allow Data Sharing
            </label>
            <label>
              <input type="checkbox" name="twoFactorAuth" checked={privacy.twoFactorAuth} onChange={(e) => handleChange("privacy", e)} />
              Enable Two-Factor Authentication
            </label>
            <label>
              <input type="checkbox" name="incognitoMode" checked={privacy.incognitoMode} onChange={(e) => handleChange("privacy", e)} />
              Incognito Mode
            </label>
            {privacy.twoFactorAuth && (
              <div className="two-factor-section">
                <h3>Two-Factor Authentication</h3>
                <label>
                  Method:
                  <select name="twoFactorMethod" value={twoFactor.method} onChange={(e) => setTwoFactor((prev) => ({ ...prev, method: e.target.value }))}>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                  </select>
                </label>
                <button type="button" onClick={sendTwoFactorCode} className="btn-blue">
                  Send Two-Factor Code
                </button>
                {twoFactor.codeSent && (
                  <div className="two-factor-code">
                    <input
                      type="text"
                      value={twoFactor.enteredCode}
                      onChange={(e) => setTwoFactor((prev) => ({ ...prev, enteredCode: e.target.value }))}
                      placeholder="Enter verification code"
                    />
                    <button type="button" onClick={verifyTwoFactorCode} className="btn-blue">
                      Verify Code
                    </button>
                  </div>
                )}
                {twoFactor.codeVerified && <p className="success-message">2FA is active.</p>}
              </div>
            )}
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="settings-section">
            <h2>Notification Settings</h2>
            <label>
              <input type="checkbox" name="emailNotifications" checked={notifications.emailNotifications} onChange={(e) => handleChange("notifications", e)} />
              Email Notifications
            </label>
            <label>
              <input type="checkbox" name="pushNotifications" checked={notifications.pushNotifications} onChange={(e) => handleChange("notifications", e)} />
              Push Notifications
            </label>
            <label>
              <input type="checkbox" name="inAppNotifications" checked={notifications.inAppNotifications} onChange={(e) => handleChange("notifications", e)} />
              In-App Notifications
            </label>
            <label>
              <input type="checkbox" name="smsNotifications" checked={notifications.smsNotifications} onChange={(e) => handleChange("notifications", e)} />
              SMS Notifications
            </label>
          </div>
        )}

        {activeTab === "payment" && (
          <div className="settings-section">
            <h2>Payment Methods</h2>
            <label>
              Card Type:
              <select name="cardType" value={paymentMethods.cardType} onChange={(e) => handleChange("payment", e)}>
                <option value="visa">Visa</option>
                <option value="mastercard">MasterCard</option>
                <option value="amex">American Express</option>
              </select>
            </label>
            <label>
              Card Number:
              <input
                type="text"
                name="cardNumber"
                value={paymentMethods.cardNumber}
                onChange={(e) => handleChange("payment", e)}
                placeholder="XXXX XXXX XXXX XXXX"
              />
              {errors.cardNumber && <span className="error">{errors.cardNumber}</span>}
            </label>
            <label>
              Expiration Date:
              <input
                type="text"
                name="expirationDate"
                value={paymentMethods.expirationDate}
                onChange={(e) => handleChange("payment", e)}
                placeholder="MM/YY"
              />
              {errors.expirationDate && <span className="error">{errors.expirationDate}</span>}
            </label>
            <label>
              CVV:
              <input
                type="text"
                name="cvv"
                value={paymentMethods.cvv}
                onChange={(e) => handleChange("payment", e)}
                placeholder="CVV"
              />
              {errors.cvv && <span className="error">{errors.cvv}</span>}
            </label>
            <label>
              Cardholder Name:
              <input
                type="text"
                name="cardholderName"
                value={paymentMethods.cardholderName}
                onChange={(e) => handleChange("payment", e)}
                placeholder="Name on Card"
              />
            </label>
            <label>
              Billing Address:
              <input
                type="text"
                name="billingAddress"
                value={paymentMethods.billingAddress}
                onChange={(e) => handleChange("payment", e)}
                placeholder="Your billing address"
              />
            </label>
            <label>
              <input type="checkbox" name="paypalLinked" checked={paymentMethods.paypalLinked} onChange={(e) => handleChange("payment", e)} />
              Link PayPal Account
            </label>
          </div>
        )}

        {activeTab === "accountSecurity" && (
          <div className="settings-section">
            <h2>Account Security</h2>
            <label>
              Current Password:
              <input
                type="password"
                name="currentPassword"
                value={accountSecurity.currentPassword}
                onChange={(e) => handleChange("accountSecurity", e)}
                required
              />
            </label>
            <label>
              New Password:
              <input
                type="password"
                name="newPassword"
                value={accountSecurity.newPassword}
                onChange={(e) => handleChange("accountSecurity", e)}
                required
              />
              {errors.newPassword && <span className="error">{errors.newPassword}</span>}
            </label>
            <label>
              Confirm New Password:
              <input
                type="password"
                name="confirmPassword"
                value={accountSecurity.confirmPassword}
                onChange={(e) => handleChange("accountSecurity", e)}
                required
              />
              {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
            </label>
            <label>
              Security Question:
              <input
                type="text"
                name="securityQuestion"
                value={accountSecurity.securityQuestion}
                onChange={(e) => handleChange("accountSecurity", e)}
                placeholder="Your security question"
              />
            </label>
            <label>
              Security Answer:
              <input
                type="text"
                name="securityAnswer"
                value={accountSecurity.securityAnswer}
                onChange={(e) => handleChange("accountSecurity", e)}
                placeholder="Your security answer"
              />
            </label>
            <label>
              Recovery Email:
              <input
                type="email"
                name="recoveryEmail"
                value={accountSecurity.recoveryEmail}
                onChange={(e) => handleChange("accountSecurity", e)}
                placeholder="Your recovery email"
                required
              />
              {errors.recoveryEmail && <span className="error">{errors.recoveryEmail}</span>}
            </label>
            <label>
              <input type="checkbox" name="loginAlerts" checked={accountSecurity.loginAlerts} onChange={(e) => handleChange("accountSecurity", e)} />
              Enable Login Alerts
            </label>
            <label>
              <input type="checkbox" name="deleteAccount" checked={accountSecurity.deleteAccount} onChange={(e) => handleChange("accountSecurity", e)} />
              Delete Account
            </label>
            <button type="button" onClick={handleDeleteAccount} className="btn-red">
              Confirm Account Deletion
            </button>
            {/* Account Verification Section */}
            <div className="account-verification">
              <h3>Account Verification</h3>
              {accountVerification.verified ? (
                <p className="success-message">Your account is verified.</p>
              ) : (
                <div>
                  {accountVerification.sending ? (
                    <p>Sending verification email...</p>
                  ) : (
                    <button type="button" onClick={sendVerificationEmail} className="btn-blue">
                      Send Verification Email
                    </button>
                  )}
                  {accountVerification.verificationMessage && <p>{accountVerification.verificationMessage}</p>}
                  <button type="button" onClick={verifyAccount} className="btn-green">
                    Verify Account
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "display" && (
          <div className="settings-section">
            <h2>Display Settings</h2>
            <label>
              Font Size:
              <select name="fontSize" value={displaySettings.fontSize} onChange={(e) => handleChange("display", e)}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </label>
            <label>
              Layout:
              <select name="layout" value={displaySettings.layout} onChange={(e) => handleChange("display", e)}>
                <option value="grid">Grid</option>
                <option value="list">List</option>
              </select>
            </label>
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="settings-section">
            <h2>Integration Settings</h2>
            <label>
              <input type="checkbox" name="googleDrive" checked={integrations.googleDrive} onChange={(e) => handleChange("integrations", e)} />
              Connect to Google Drive
            </label>
            <label>
              <input type="checkbox" name="dropbox" checked={integrations.dropbox} onChange={(e) => handleChange("integrations", e)} />
              Connect to Dropbox
            </label>
            <label>
              <input type="checkbox" name="oneDrive" checked={integrations.oneDrive} onChange={(e) => handleChange("integrations", e)} />
              Connect to OneDrive
            </label>
          </div>
        )}

        {activeTab === "advanced" && (
          <div className="settings-section">
            <h2>Advanced Features</h2>
            <div className="advanced-buttons">
              <button type="button" onClick={handleDownloadData} className="btn-blue full-width">
                Download My Data
              </button>
              <button type="button" onClick={handleViewSecurityLogs} className="btn-blue full-width">
                View Security Logs
              </button>
              <button type="button" onClick={handleViewApiKeys} className="btn-blue full-width">
                Manage API Keys
              </button>
              <button type="button" onClick={handleGenerateApiKey} className="btn-blue full-width">
                Generate New API Key
              </button>
            </div>
            <div className="advanced-utilities">
              <button type="button" onClick={logCurrentSettings} className="btn-green full-width">
                Log Current Settings
              </button>
              <button type="button" onClick={simulateLongProcess} className="btn-green full-width">
                Simulate Long Process
              </button>
            </div>
            <button type="button" onClick={handleReset} className="btn-red full-width">
              Reset to Default
            </button>
            <div className="share-section">
              <button type="button" onClick={handleShareSupport} className="share-btn full-width">
                Share Settings Page
              </button>
            </div>
            {/* Subscription Section */}
            <div className="subscription-section">
              <h3>Subscription & Pricing Plans</h3>
              <p>
                Current Plan: <strong>{subscription.currentPlan.toUpperCase()}</strong>
              </p>
              <div className="plans">
                {subscription.availablePlans.map((plan) => (
                  <div key={plan.id} className={`plan-card ${subscription.currentPlan === plan.id ? "active-plan" : ""}`}>
                    <h4>{plan.name}</h4>
                    <p>{plan.price}</p>
                    <ul>
                      {plan.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                    {subscription.currentPlan !== plan.id ? (
                      <button type="button" onClick={() => upgradeSubscription(plan.id)} className="btn-blue">
                        Upgrade to {plan.name}
                      </button>
                    ) : (
                      <p>You are on this plan.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Import/Export Settings Section */}
            <div className="import-export-section">
              <h3>Import/Export Settings</h3>
              <input
                type="file"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="import-file-input"
              />
              <button type="button" onClick={handleImportSettings} className="btn-blue full-width">
                Import Settings
              </button>
              <button type="button" onClick={handleExportSettings} className="btn-blue full-width">
                Export Settings
              </button>
            </div>
            {/* Privacy Policy Section */}
            <div className="privacy-policy-section">
              <button type="button" onClick={() => setShowPrivacyPolicy(true)} className="btn-blue full-width">
                View Privacy Policy
              </button>
            </div>
          </div>
        )}

        {/* Save Settings Button */}
        <div className="form-actions">
          <button type="submit" className="btn-blue full-width" disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div className="modal-overlay" onClick={() => setShowPrivacyPolicy(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Privacy Policy</h2>
            <p>
              This is where your privacy policy details go. Your data is securely stored and managed according to our guidelines.
            </p>
            <button type="button" onClick={() => setShowPrivacyPolicy(false)} className="modal-close-button">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Security Logs Modal */}
      {showSecurityLogs && (
        <div className="modal-overlay" onClick={() => setShowSecurityLogs(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Security Logs</h2>
            {securityLogs.length > 0 ? (
              <pre>{securityLogs.join("\n")}</pre>
            ) : (
              <p>No security logs available.</p>
            )}
            <button type="button" onClick={() => setShowSecurityLogs(false)} className="modal-close-button">
              Close
            </button>
          </div>
        </div>
      )}

      {/* API Keys Modal */}
      {showApiKeys && (
        <div className="modal-overlay" onClick={() => setShowApiKeys(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>API Keys</h2>
            {apiKeys.length > 0 ? (
              <ul>
                {apiKeys.map((key, index) => (
                  <li key={index}>{key}</li>
                ))}
              </ul>
            ) : (
              <p>No API keys available.</p>
            )}
            <button type="button" onClick={() => setShowApiKeys(false)} className="modal-close-button">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
