import React, { useState, useEffect } from 'react'
import { DateTime } from 'luxon'
import NewGoalForm from './NewGoalForm'
import { supabaseClient } from '../utils/supabaseClient'
import SettingsModal from './SettingsModal'
import GoalCreationSidebar from './GoalCreationSidebar'
import ReminderCreationModal from './ReminderCreationModal'
import ManageModal from './ManageModal'
import { Plus, Settings } from 'lucide-react'

const Sidebar = ({ 
  goals,
  setGoals, 
  onSelectGoal, 
  selectedGoal,
  className,
  searchQuery,
  onSearchChange,
  onReminderCreated,
  user,
  reminders,
  setViewMode
}) => {
  const [sortBy, setSortBy] = useState('priority')
  const [filterType, setFilterType] = useState('')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    goalId: null
  })
  
  // State for dropdown menu
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [type, setType] = useState('goal'); // Default type
  const [showGoalCreation, setShowGoalCreation] = useState(false);
  const [showReminderCreation, setShowReminderCreation] = useState(false);

  // State for manage dropdown and modal
  const [manageDropdownVisible, setManageDropdownVisible] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageType, setManageType] = useState('all');

  const filteredGoals = goals
    .filter(goal => goal.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(goal => filterType ? goal.type === filterType : true)
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return a.priority - b.priority
        case 'date':
          return DateTime.fromISO(a.dueDate) - DateTime.fromISO(b.dueDate)
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

  const handleContextMenu = (e, goalId) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      goalId
    })
  }

  const handleEditGoal = (goal) => {
    onSelectGoal(goal);
    setType(goal.type || 'goal'); // Set the type based on the selected goal or default to 'goal'
    setShowSettingsModal(true);
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      const { error } = await supabaseClient
        .from('goals')
        .delete()
        .eq('id', goalId)

      if (error) throw error

      setGoals(goals.filter(g => g.id !== goalId))
      if (selectedGoal?.id === goalId) {
        onSelectGoal(null)
      }
    } catch (err) {
      console.error('Error deleting goal:', err)
      alert('Failed to delete goal')
    } finally {
      setContextMenu({ ...contextMenu, visible: false })
    }
  }

  const handleDropdownToggle = (e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    setDropdownVisible(prev => !prev); // Toggle dropdown visibility
  };

  const handleCreateOptionClick = (selectedType) => {
    setDropdownVisible(false);
    setType(selectedType);

    if (selectedType === 'reminder') {
        setShowGoalCreation(false); // Ensure the goal creation sidebar is closed
        setShowReminderCreation(true); // Open the reminder creation modal
    } else {
        setShowGoalCreation(true); // Open creation sidebar for goals, tasks, and projects
    }
  };

  const handleManageOptionClick = (type) => {
    setManageDropdownVisible(false);
    setManageType(type);
    setShowManageModal(true);
  };

  const handleDragStart = (e, goalId) => {
    e.dataTransfer.setData("text/plain", goalId);
    e.currentTarget.classList.add('dragging');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    e.currentTarget.style.backgroundColor = '';
  };

  const handleDrop = async (e, targetGoalId) => {
    e.preventDefault();
    const draggedGoalId = e.dataTransfer.getData("text/plain");

    if (!draggedGoalId || draggedGoalId === targetGoalId) return;

    // Find the dragged goal
    const draggedGoal = goals.find(g => g.id === draggedGoalId);
    if (!draggedGoal) return;

    // Create a copy of the goals array without the dragged goal
    const goalsWithoutDragged = goals.filter(g => g.id !== draggedGoalId);

    // Insert the dragged goal at the target position
    const targetIndex = goalsWithoutDragged.findIndex(g => g.id === targetGoalId);
    const updatedGoals = [
      ...goalsWithoutDragged.slice(0, targetIndex),
      draggedGoal,
      ...goalsWithoutDragged.slice(targetIndex)
    ];

    // Update the goals in the database
    try {
      const { error } = await supabaseClient
        .from('goals')
        .upsert(updatedGoals);

      if (error) throw error;

      setGoals(updatedGoals);
    } catch (err) {
      console.error('Error updating goals:', err);
      alert('Failed to update goals');
    }
  };

  const handleReminderCreated = (newReminder) => {
    onReminderCreated(newReminder);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false })
      }
      if (dropdownVisible === true) {
        setDropdownVisible(false);
      }
      if (manageDropdownVisible === true) {
        setManageDropdownVisible(false);
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu.visible, dropdownVisible, manageDropdownVisible])

  useEffect(() => {
    const handleReminderUpdate = (event) => {
      if (onReminderCreated) {
        onReminderCreated(event.detail);
      }
    };

    window.addEventListener('reminderUpdate', handleReminderUpdate);
    return () => window.removeEventListener('reminderUpdate', handleReminderUpdate);
  }, [onReminderCreated]);

  return (
    <div className={`sidebar ${className}`}>
      <div className="sidebar-header">
        <h2>Goals & Projects</h2>
        <div className="sidebar-button-group">
          <div className="dropdown-container">
            <button onClick={handleDropdownToggle} className="control-button">
              <Plus size={20}/>
            </button>
            {dropdownVisible && (
              <div className="dropdown">
                <button onClick={() => handleCreateOptionClick('goal')}>New Goal</button>
                <button onClick={() => handleCreateOptionClick('project')}>New Project</button>
                <button onClick={() => handleCreateOptionClick('task')}>New Task</button>
                <button onClick={() => handleCreateOptionClick('reminder')}>Reminder</button>
              </div>
            )}
          </div>

          <div className="dropdown-container">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setManageDropdownVisible(prev => !prev);
              }} 
              className="control-button"
            >
              <Settings size={20} />
            </button>
            {manageDropdownVisible && (
              <div className="dropdown">
                <button onClick={() => handleManageOptionClick('all')}>All Items</button>
                <button onClick={() => handleManageOptionClick('goal')}>Goals</button>
                <button onClick={() => handleManageOptionClick('task')}>Tasks</button>
                <button onClick={() => handleManageOptionClick('project')}>Projects</button>
                <button onClick={() => handleManageOptionClick('reminder')}>Reminders</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sidebar-controls">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        <div className="select-controls">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select">
            <option value="priority">Sort by Priority</option>
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="select">
            <option value="">All Types</option>
            <option value="goal">Goals</option>
            <option value="task">Tasks</option>
            <option value="project">Projects</option>
          </select>
        </div>
      </div>

      <div className="goals-list">
        {filteredGoals.map(goal => (
          <div 
            key={goal.id} 
            className={`goal-card ${goal.type} ${selectedGoal?.id === goal.id ? 'selected' : ''}`} 
            onContextMenu={(e) => handleContextMenu(e, goal.id)}
            onClick={() => {onSelectGoal(goal); setViewMode('month')}}
            draggable
            onDragStart={(e) => handleDragStart(e, goal.id)}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, goal.id)}
          >
            <div className="goal-header">
              <h3 className="goal-title" title={goal.title}>{goal.title}</h3>
              <span className="goal-type" style={{marginBottom: "4px"}}>{` ${goal.type}`}</span>
              <button 
                className="triple-dot-button" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e, goal.id);
                }}
              >
                ⋮
              </button>
            </div>
            <p className="goal-description" title={goal.description}>{goal.description}</p>
            {goal.dueDate && (
              <span className="due-date">Due: {DateTime.fromISO(goal.dueDate).toFormat('LLL dd, yyyy')}</span>
            )}
          </div>
        ))}
      </div>

      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={() => handleEditGoal(goals.find(g => g.id === contextMenu.goalId))}>
            Edit
          </button>
          <button onClick={() => handleDeleteGoal(contextMenu.goalId)}>
            Delete
          </button>
        </div>
      )}

      {showGoalCreation && (
        <>
          <div className="modal-overlay" onClick={() => setShowGoalCreation(false)} />
          <GoalCreationSidebar 
            onClose={() => setShowGoalCreation(false)}
            onGoalCreated={(newGoal) => {
              // Remove the manual state update since it will be handled by the subscription
              setShowGoalCreation(false);
            }}
            type={type}
          />
        </>
      )}

      {showSettingsModal && (
        <SettingsModal 
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          goal={selectedGoal}
          onUpdate={(updatedGoal) => {
            if (updatedGoal.deleted) {
              // Handle deletion
              setGoals(prevGoals => prevGoals.filter(g => g.id !== updatedGoal.id));
              onSelectGoal(null);
            } else {
              // Handle update
              setGoals(prevGoals => 
                prevGoals.map(g => g.id === updatedGoal.id ? updatedGoal : g)
              );
              onSelectGoal(updatedGoal);
            }
            setShowSettingsModal(false);
          }}
          type={type}
        />
      )}

      {showReminderCreation && (
        <ReminderCreationModal 
            onClose={() => setShowReminderCreation(false)}
            onReminderCreated={handleReminderCreated}
            user={user} // Pass user prop
        />
      )}

      {showManageModal && (
        <ManageModal
          type={manageType}
          goals={goals}
          setGoals={setGoals}
          onClose={() => setShowManageModal(false)}
          user={user}
          reminders={reminders} // Add this line
        />
      )}
    </div>
  )
}

export default Sidebar