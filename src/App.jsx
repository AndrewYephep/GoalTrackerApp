import { useState, useEffect } from 'react'
import { DateTime } from 'luxon'
import Header from './components/Header'
import Auth from './auth/Auth'
import Calendar from './components/Calendar'
import Home from './components/Home'
import Sidebar from './components/Sidebar'
import QuickForm from './components/QuickForm'
import SettingsModal from './components/SettingsModal'
import EnhancedGoalCard from './components/EnhancedGoalCard'
import { supabaseClient } from './utils/supabaseClient'
import GoalCreationSidebar from './components/GoalCreationSidebar'
import { useAuth } from './AuthContext'

function App() {
  const { user, loading, setUser } = useAuth()
  const [goals, setGoals] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTab, setCurrentTab] = useState("home")
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [viewMode, setViewMode] = useState('month')
  const [currentDate, setCurrentDate] = useState(DateTime.now())
  const [quickForm, setQuickForm] = useState({ visible: false, date: null })
  const [showSettings, setShowSettings] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true'
  })
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    goalId: null
  })
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showGoalCreationSidebar, setShowGoalCreationSidebar] = useState(false)
  const [reminders, setReminders] = useState([]);
  
  useEffect(() => {
    // Apply dark mode from localStorage
    const isDark = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(isDark)
    if (isDark) {
      document.body.classList.add('dark-mode')
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    // Set up real-time subscription for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user); // Debug log
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    // Check initial session
    const checkSession = async () => {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (session?.user) {
        console.log('Initial session found:', session.user); // Debug log
        setUser(session.user);
      }
    };

    checkSession();

    return () => {
      subscription?.unsubscribe();
    };
  }, [setUser]);

  // Add a new useEffect for loading goals when user signs in
  useEffect(() => {
    const loadUserGoals = async () => {
      if (!user) return

      try {
        const { data, error } = await supabaseClient
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .order('priority', { ascending: true })

        if (error) throw error

        // Transform dates to ISO strings and ensure checkups array exists
        const goalsWithDefaults = data.map(goal => ({
          ...goal,
          created_at: goal.created_at || DateTime.now().toISO(),
          checkups: goal.checkups || [],
          weeklyDays: goal.weeklyDays || [],
          priority: goal.priority || 0
        }))

        setGoals(goalsWithDefaults)
      } catch (err) {
        console.error('Error loading goals:', err)
        alert('Failed to load goals')
      }
    }

    loadUserGoals()

    // Set up real-time subscription for goal updates
    let subscription
    if (user) {
      subscription = supabaseClient
        .channel('goals_channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${user.id}`
        }, payload => {
          // Handle different types of changes
          switch (payload.eventType) {
            case 'INSERT':
              // Check if goal already exists before adding
              setGoals(current => {
                if (current.some(goal => goal.id === payload.new.id)) {
                  return current;
                }
                return [...current, payload.new];
              });
              break
            case 'UPDATE':
              setGoals(current => 
                current.map(goal => 
                  goal.id === payload.new.id ? payload.new : goal
                )
              )
              break
            case 'DELETE':
              setGoals(current => 
                current.filter(goal => goal.id !== payload.old.id)
              )
              break
            default:
              break
          }
        })
        .subscribe()
    }

    return () => {
      if (subscription) {
        supabaseClient.removeChannel(subscription)
      }
    }
  }, [user]);

  useEffect(() => {
    const loadUserReminders = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabaseClient
          .from('reminders')
          .select('*')
          .eq('user_id', user.id);
        if (error) throw error;
        setReminders(data);
      } catch (err) {
        console.error('Error loading reminders:', err);
      }
    };
    loadUserReminders();
  }, [user]);

  useEffect(() => {
    if (!user) {
      // Clear any existing goals and state when user is not authenticated
      setGoals([]);
      setSelectedGoal(null);
      setCurrentTab("home");
    }
  }, [user]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('darkMode', newMode);
      document.body.classList.toggle('dark-mode', newMode);
      return newMode;
    });
  }

  const handleGoalUpdate = (updatedGoal) => {
    setGoals(prevGoals => 
      prevGoals.map(g => g.id === updatedGoal.id ? updatedGoal : g)
    );
    if (selectedGoal?.id === updatedGoal.id) {
      setSelectedGoal(updatedGoal);
    }
  };

  const handleReminderCreated = (newReminder) => {
    setReminders([...reminders, newReminder]);
  };

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <Header 
        toggleSidebar={toggleSidebar}
        toggleDarkMode={toggleDarkMode}
        isDarkMode={isDarkMode}
        userEmail={user.email}
        isSidebarCollapsed={isSidebarCollapsed}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        user={user}              // Add these
        setUser={setUser}        // two props
      />
      <Sidebar 
        className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}
        goals={goals}
        setGoals={setGoals}
        onSelectGoal={(goal) => {
          setSelectedGoal(goal);
          setCurrentTab('calendar');
        }}
        selectedGoal={selectedGoal}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onReminderCreated={handleReminderCreated}
        setShowGoalCreationSidebar={setShowGoalCreationSidebar}
        user={user}  // Add user prop here
        reminders={reminders} // Added to pass reminders to Sidebar
        setViewMode={setViewMode}
      />
      <div className={`main-content ${isSidebarCollapsed ? 'full-width' : ''}`}>
        {currentTab === 'home' ? (
          <Home 
            goals={goals} 
            onSelectGoal={(goal) => {
              setSelectedGoal(goal);
              setCurrentTab('calendar');
            }}
            setCurrentTab={setCurrentTab}
            setViewMode={setViewMode}
          />
        ) : (
          <Calendar 
            goals={goals}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            currentDate={currentDate}
            onChangeDate={setCurrentDate}
            selectedGoal={selectedGoal}
            setSelectedGoal={setSelectedGoal}
            setGoals={handleGoalUpdate}
            user={user}
            reminders={reminders}
          />
        )}
      </div>

      {quickForm.visible && (
        <QuickForm 
          date={quickForm.date}
          onClose={() => setQuickForm({ visible: false, date: null })}
          onSubmit={async (newGoal) => {
            try {
              const { data, error } = await supabaseClient
                .from('goals')
                .insert([{ 
                  ...newGoal, 
                  user_id: user.id,
                  created_at: DateTime.now().toISO(),
                  checkups: [],
                  priority: goals.length
                }])
                .select()
              
              if (error) throw error
              setGoals([...goals, data[0]])
              setQuickForm({ visible: false, date: null })
            } catch (err) {
              console.error('Error creating goal:', err)
              alert('Failed to create goal')
            }
          }}
        />
      )}

      {showSettings && (
        <SettingsModal 
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />
      )}

      {showGoalCreationSidebar && (
        <>
          <div className="modal-overlay" onClick={() => setShowGoalCreationSidebar(false)} />
          <GoalCreationSidebar 
            onClose={() => setShowGoalCreationSidebar(false)}
            onGoalCreated={(newGoal) => {
              setGoals([...goals, newGoal]);
              setShowGoalCreationSidebar(false);
            }}
          />
        </>
      )}
    </div>
  )
}

export default App