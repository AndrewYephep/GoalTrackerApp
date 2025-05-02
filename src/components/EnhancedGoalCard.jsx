import React, { useState } from 'react'
import { DateTime } from 'luxon'
import { supabaseClient } from '../utils/supabaseClient'

const EnhancedGoalCard = ({ goal, onEdit, onDelete, onClick }) => {
  const [isUpdating, setIsUpdating] = useState(false)

  const dueDate = DateTime.fromISO(goal.dueDate)
  const isOverdue = dueDate < DateTime.now() && !goal.checkups?.some(c => c.status === 'done')

  const calculateProgress = () => {
    if (!goal.checkups?.length) return 0
    const completedCheckups = goal.checkups.filter(c => c.status === 'done').length
    return (completedCheckups / goal.checkups.length) * 100
  }

  const daysUntilDue = () => {
    if (!goal.dueDate) return null
    const now = DateTime.now()
    const days = dueDate.diff(now, 'days').days
    return Math.ceil(days)
  }

  const handleStatusUpdate = async (status) => {
    setIsUpdating(true)
    try {
      const newCheckup = {
        date: DateTime.now().toISO(),
        status,
        notes: ''
      }

      const updatedCheckups = [...(goal.checkups || []), newCheckup]

      const { error } = await supabaseClient
        .from('goals')
        .update({ checkups: updatedCheckups })
        .eq('id', goal.id)

      if (error) throw error

      // Refresh goal data
      onEdit({ ...goal, checkups: updatedCheckups })
    } catch (err) {
      console.error('Error updating status:', err)
      alert('Failed to update status')
    }
    setIsUpdating(false)
  }

  return (
    <div className="card home" onClick={onClick}>
      <h3 className="goal-title">{goal.title}</h3>
      <p className="goal-description">{goal.description}</p>
      <div className="flex justify-between items-center">
        <div>
          <span>Due in: </span>
          <span className={daysUntilDue() < 5 ? 'text-red-600' : ''}>
            {daysUntilDue() !== null ? `${daysUntilDue()} days` : 'No due date'}
          </span>
        </div>
        <div>
          <span>Consistency: </span>
          <span>{Math.round(calculateProgress())}%</span>
        </div>
      </div>
      <div className="progress-bar">
        <div 
          className="progress"
          style={{ width: `${calculateProgress()}%` }}
        />
      </div>
    </div>
  )
}

export default EnhancedGoalCard