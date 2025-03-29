import React from 'react'
import { supabaseClient } from '../utils/supabaseClient'

const Header = ({ 
  toggleSidebar, 
  toggleDarkMode, 
  isDarkMode, 
  userEmail,
  isSidebarCollapsed,
  showSettings,
  setShowSettings,
  currentTab,
  setCurrentTab,
  viewMode,
  setViewMode,
  user,
  setUser
}) => {
  const handleSignOut = async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      
      // Clear local auth state
      setUser(null);
      
      // Force a page reload to clear any cached state
      window.location.reload();
    } catch (err) {
      console.error('Error signing out:', err);
      alert('Failed to sign out');
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <button 
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          style={{fontSize: '1.5rem'}}
        >
          {isSidebarCollapsed ? '▶' : '◀'}
        </button>

        {/* Tab Switching */}
        <div className="view-tabs">
          <button
            className={`tab-button ${currentTab === 'overview' ? 'active' : ''}`}
            onClick={() => setCurrentTab('overview')}
          >
            Weekly Overview
          </button>
          <button
            className={`tab-button ${currentTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setCurrentTab('calendar')}
          >
            Calendar
          </button>
        </div>

        {/* Calendar View Controls - Only show when calendar tab is active */}
        {currentTab === 'calendar' && (
          <div className="calendar-view-controls">
            <button
              className={`view-button ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button
              className={`view-button ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button
              className={`view-button ${viewMode === 'day' ? 'active' : ''}`}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
          </div>
        )}
      </div>
      
      <div className="header-right">
        <button 
          className="settings-button"
          onClick={() => setShowSettings(true)}
        >
          ⚙️ Settings
        </button>
        <button 
          className="theme-toggle"
          onClick={toggleDarkMode}
        >
          {isDarkMode ? '🌙' : '☀️'} Theme
        </button>
        <span className="user-email">{userEmail}</span>
        <button
          className="btn-sign-out"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}

export default Header