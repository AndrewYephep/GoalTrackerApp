import React, { useState } from 'react'
import { DateTime } from 'luxon'
import EnhancedGoalCard from './EnhancedGoalCard'

const Home = ({ goals, onSelectGoal, setCurrentTab, setViewMode }) => {
  const [filterType, setFilterType] = useState('all')
  const [timeRange, setTimeRange] = useState('all')
  const [sortBy, setSortBy] = useState('due-date')

  const filterGoals = () => {
    const today = DateTime.now()
    const startOfWeek = today.startOf('week')
    const endOfWeek = today.endOf('week')
    
    return goals.filter(goal => {
      // Type filter
      if (filterType !== 'all' && goal.type !== filterType) return false
      
      const dueDate = goal.dueDate ? DateTime.fromISO(goal.dueDate) : null
      
      // Time range filter
      switch (timeRange) {
        case 'this-week':
          return dueDate && dueDate >= startOfWeek && dueDate <= endOfWeek
        case 'past-due':
          return dueDate && dueDate < today
        case 'due-soon':
          return dueDate && dueDate >= today && dueDate <= today.plus({ days: 7 })
        case 'all':
          return true
        default:
          return true
      }
    }).sort((a, b) => {
      switch (sortBy) {
        case 'due-date':
          return DateTime.fromISO(a.dueDate) - DateTime.fromISO(b.dueDate)
        case 'priority':
          return (b.priority || 0) - (a.priority || 0)
        case 'progress':
          const progressA = calculateProgress(a)
          const progressB = calculateProgress(b)
          return progressB - progressA
        default:
          return 0
      }
    })
  }

  const calculateProgress = (goal) => {
    if (!goal.checkups?.length) return 0
    const completedCheckups = goal.checkups.filter(c => c.status === 'done').length
    return (completedCheckups / goal.checkups.length) * 100
  }

  const handleGoalClick = (goal) => {
    setCurrentTab('calendar');
    setViewMode('month')
    onSelectGoal(goal);
  };

  const filteredGoals = filterGoals()

  return (
    <div className="home-tab">
      <div className="button-group" style={{justifyContent: 'flex-start', maxWidth: "500px"}}>
        <select 
          className="select"
          style={{ maxWidth: '30%'}}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="goal">Goals</option>
          <option value="task">task</option>
          <option value="project">Projects</option>
        </select>

        <select 
          className="select"
          style={{ maxWidth: '30%'}}
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="all">All Items</option>
          <option value="this-week">This Week</option>
          <option value="past-due">Past Due</option>
          <option value="due-soon">Due Soon</option>
        </select>

        <select 
          className="select"
          style={{ maxWidth: '30%'}}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="due-date">Sort by Due Date</option>
          <option value="priority">Sort by Priority</option>
          <option value="progress">Sort by Progress</option>
        </select>
      </div>

      <div className="goal-grid">
        {filteredGoals.length > 0 ? (
          filteredGoals.map(goal => (
            <EnhancedGoalCard 
              key={goal.id}
              goal={goal}
              onClick={() => handleGoalClick(goal)}
            />
          ))
        ) : (
          <div className="col-span-full text-center italic text-gray-600">
            No items match the current filters.
          </div>
        )}
      </div>
    </div>
  )
}

export default Home