import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Settings.css";

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [prefLoading, setPrefLoading] = useState(false);

  // fetch current user preferences on mount
  useEffect(() => {
    async function fetchPrefs() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        const res = await axios.get("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = res.data;
        if (user.preferences) {
          setEmailNotifications(user.preferences.emailNotifications !== false);
        }
      } catch (err) {
        setError("Could not load settings");
      } finally {
        setLoading(false);
      }
    }
    fetchPrefs();
  }, [navigate]);

  // handle password change
  async function handlePasswordChange(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/users/me/password",
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  }

  // handle preference toggle
  async function handlePrefChange(e) {
    const newValue = e.target.checked;
    setEmailNotifications(newValue);
    setPrefLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/users/me/preferences",
        { emailNotifications: newValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Preferences saved");
    } catch (err) {
      setError("Failed to save preferences");
      // revert
      setEmailNotifications(!newValue);
    } finally {
      setPrefLoading(false);
    }
  }

  if (loading) return <div className="settings-loading">Loading settings...</div>;

  return (
    <div className="settings-page">
      <h1 className="settings-title"><i className="fas fa-cog"></i> Settings</h1>

      {error && <div className="settings-error">{error}</div>}
      {success && <div className="settings-success">{success}</div>}

      <div className="settings-card">
        <h2>Change Password</h2>
        <form onSubmit={handlePasswordChange} className="settings-form">
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={passwordLoading}>
            {passwordLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      <div className="settings-card">
        <h2>Preferences</h2>
        <div className="preference-item">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={handlePrefChange}
              disabled={prefLoading}
            />
            <span>Receive email notifications</span>
          </label>
          {prefLoading && <span className="saving-indicator">Saving...</span>}
        </div>
      </div>
    </div>
  );
}