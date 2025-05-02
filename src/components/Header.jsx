import React from 'react'
import { supabaseClient } from '../utils/supabaseClient'
import { Settings, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react'

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
        >
          {isSidebarCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>

        {/* Tab Switching */}
        <div className="view-tabs">
          <button
            className={`tab-button ${currentTab === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentTab('home')}
          >
            Home
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
          <Settings size={20} />
        </button>
        <button 
          className="theme-toggle"
          onClick={toggleDarkMode}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
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