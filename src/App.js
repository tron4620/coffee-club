import React, { useState, useEffect } from 'react';

/**
 * Coffee Club Tracker - React App
 * 
 * A beautiful, tablet-optimized interface for tracking office coffee consumption.
 * Connects to Google Sheets via Apps Script Web App.
 * 
 * Features:
 * - Touch-optimized large buttons
 * - Real-time balance display
 * - Confirmation dialogs that work on tablets
 * - Color-coded status indicators
 * - Smooth animations
 * - Offline-friendly with error handling
 */

const CoffeeClubApp = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);

  // Google Apps Script Web App URL (you'll need to replace this after deployment)
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwNNKpnz6jtzXHSw1_LYcDvo9PoaL51DYh-18E_s2A-PWsSYSOh-UjZZJHR33mESBYFfg/exec';

  // Load users from Google Sheets
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${SCRIPT_URL}?action=getUsers`);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch (err) {
      setError('Unable to connect to Google Sheets. Check your internet connection.');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'logCoffee',
          name: selectedUser.name,
          row: selectedUser.row
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setUsers(users.map(u => 
          u.name === selectedUser.name 
            ? { ...u, used: u.used + 1, remaining: u.remaining - 1 }
            : u
        ));

        // Show success notification
        showNotification(
          `☕ Coffee logged for ${selectedUser.name}!`,
          `Remaining: ${selectedUser.remaining - 1}`,
          'success'
        );
      } else {
        showNotification('Error', data.error || 'Failed to log coffee', 'error');
      }
    } catch (err) {
      showNotification('Error', 'Unable to log coffee. Check connection.', 'error');
      console.error('Error logging coffee:', err);
    } finally {
      setShowConfirm(false);
      setSelectedUser(null);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setSelectedUser(null);
  };

  const showNotification = (title, message, type = 'info') => {
    setNotification({ title, message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getStatusColor = (remaining) => {
    if (remaining <= 0) return { bg: '#fee', border: '#f66', text: '#c00' };
    if (remaining <= 3) return { bg: '#fff4e6', border: '#ffa94d', text: '#e67700' };
    return { bg: '#e7f5ff', border: '#4dabf7', text: '#1971c2' };
  };

  const getStatusEmoji = (remaining) => {
    if (remaining <= 0) return '❌';
    if (remaining <= 3) return '⚠️';
    return '✅';
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading coffee club...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <h2 style={styles.errorTitle}>⚠️ Connection Error</h2>
          <p style={styles.errorMessage}>{error}</p>
          <button style={styles.retryButton} onClick={loadUsers}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>☕ Coffee Club</h1>
        <button style={styles.refreshButton} onClick={loadUsers}>
          🔄 Refresh
        </button>
      </header>

      {/* User Grid */}
      <div style={styles.grid}>
        {users.map((user) => {
          const colors = getStatusColor(user.remaining);
          const emoji = getStatusEmoji(user.remaining);
          
          return (
            <button
              key={user.name}
              style={{
                ...styles.userCard,
                backgroundColor: colors.bg,
                borderColor: colors.border,
              }}
              onClick={() => handleUserClick(user)}
            >
              <div style={styles.userName}>{user.name}</div>
              <div style={styles.userStats}>
                <div style={styles.statRow}>
                  <span style={styles.statLabel}>Used:</span>
                  <span style={styles.statValue}>{user.used}</span>
                </div>
                <div style={styles.statRow}>
                  <span style={styles.statLabel}>Purchased:</span>
                  <span style={styles.statValue}>{user.purchased}</span>
                </div>
                <div style={{
                  ...styles.remaining,
                  color: colors.text,
                  borderColor: colors.border,
                }}>
                  <span style={styles.remainingEmoji}>{emoji}</span>
                  <span style={styles.remainingText}>{user.remaining} left</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && selectedUser && (
        <div style={styles.modalOverlay} onClick={handleCancel}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Confirm Coffee</h2>
            <p style={styles.modalMessage}>
              Did <strong>{selectedUser.name}</strong> just have a coffee?
            </p>
            <div style={styles.modalStats}>
              <div>Current: {selectedUser.used} used</div>
              <div>After: {selectedUser.used + 1} used</div>
              <div>Remaining: {selectedUser.remaining - 1}</div>
            </div>
            <div style={styles.modalButtons}>
              <button style={styles.cancelButton} onClick={handleCancel}>
                ❌ Cancel
              </button>
              <button style={styles.confirmButton} onClick={handleConfirm}>
                ✅ Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div style={{
          ...styles.notification,
          backgroundColor: notification.type === 'success' ? '#d3f9d8' : '#ffe3e3',
          borderColor: notification.type === 'success' ? '#51cf66' : '#ff6b6b',
        }}>
          <div style={styles.notificationTitle}>{notification.title}</div>
          <div style={styles.notificationMessage}>{notification.message}</div>
        </div>
      )}
    </div>
  );
};

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  },
  
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: '700',
    color: '#2d3748',
    letterSpacing: '-0.5px',
  },
  
  refreshButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#667eea',
    background: 'white',
    border: '2px solid #667eea',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      background: '#667eea',
      color: 'white',
    },
  },
  
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  
  userCard: {
    padding: '30px',
    border: '3px solid',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textAlign: 'left',
    fontSize: '16px',
    fontWeight: '500',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    transform: 'translateY(0)',
    ':hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
    },
    ':active': {
      transform: 'scale(0.98)',
    },
  },
  
  userName: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: '10px',
  },
  
  userStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
  },
  
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '16px',
    color: '#4a5568',
  },
  
  statLabel: {
    fontWeight: '500',
  },
  
  statValue: {
    fontWeight: '700',
  },
  
  remaining: {
    marginTop: 'auto',
    padding: '12px 16px',
    border: '2px solid',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center',
  },
  
  remainingEmoji: {
    fontSize: '20px',
  },
  
  remainingText: {
    fontSize: '18px',
  },
  
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s',
  },
  
  modal: {
    background: 'white',
    borderRadius: '24px',
    padding: '40px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  modalTitle: {
    margin: '0 0 15px 0',
    fontSize: '28px',
    fontWeight: '700',
    color: '#2d3748',
  },
  
  modalMessage: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    color: '#4a5568',
    lineHeight: '1.6',
  },
  
  modalStats: {
    background: '#f7fafc',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '16px',
    color: '#4a5568',
  },
  
  modalButtons: {
    display: 'flex',
    gap: '15px',
  },
  
  cancelButton: {
    flex: 1,
    padding: '16px',
    fontSize: '18px',
    fontWeight: '600',
    color: '#e53e3e',
    background: 'white',
    border: '2px solid #e53e3e',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      background: '#fff5f5',
    },
  },
  
  confirmButton: {
    flex: 1,
    padding: '16px',
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    background: '#38a169',
    border: '2px solid #38a169',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      background: '#2f855a',
    },
  },
  
  notification: {
    position: 'fixed',
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '20px 30px',
    borderRadius: '16px',
    border: '2px solid',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    zIndex: 2000,
    minWidth: '300px',
    animation: 'slideUp 0.3s',
  },
  
  notificationTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '5px',
    color: '#2d3748',
  },
  
  notificationMessage: {
    fontSize: '16px',
    color: '#4a5568',
  },
  
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  
  spinner: {
    width: '60px',
    height: '60px',
    border: '6px solid rgba(255, 255, 255, 0.3)',
    borderTop: '6px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  
  loadingText: {
    marginTop: '20px',
    fontSize: '18px',
    color: 'white',
    fontWeight: '600',
  },
  
  error: {
    background: 'white',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '500px',
    margin: '100px auto',
    textAlign: 'center',
  },
  
  errorTitle: {
    color: '#e53e3e',
    marginBottom: '15px',
  },
  
  errorMessage: {
    color: '#4a5568',
    marginBottom: '30px',
    fontSize: '16px',
  },
  
  retryButton: {
    padding: '12px 30px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: '#667eea',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
};

export default CoffeeClubApp;
