import React, { useState } from 'react'
import { DateTime } from 'luxon'
import { supabaseClient } from '../utils/supabaseClient'

const CheckupView = ({ goal, onUpdate }) => {
  const [newNote, setNewNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const calculateProgress = () => {
    if (!goal.checkups?.length) return 0
    const completedCheckups = goal.checkups.filter(c => c.status === 'done').length
    return Math.round((completedCheckups / goal.checkups.length) * 100)
  }

  const daysUntilDue = () => {
    if (!goal.dueDate) return null
    const dueDate = DateTime.fromISO(goal.dueDate)
    const now = DateTime.now()
    return Math.ceil(dueDate.diff(now, 'days').days)
  }

  const handleStatusUpdate = async (status) => {
    setIsSubmitting(true)
    try {
      const newCheckup = {
        date: DateTime.now().toISO(),
        status,
        notes: newNote.trim()
      }

      const updatedCheckups = [...(goal.checkups || []), newCheckup]

      const { error } = await supabaseClient
        .from('goals')
        .update({ checkups: updatedCheckups })
        .eq('id', goal.id)

      if (error) throw error

      onUpdate({ ...goal, checkups: updatedCheckups })
      setNewNote('')
    } catch (err) {
      console.error('Error updating status:', err)
      alert('Failed to update status')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="checkup-view">
      <div className="goal-header">
        <h2>{goal.title}</h2>
        <span className={`goal-type ${goal.type}`}>{goal.type}</span>
      </div>

      <div className="goal-stats">
        <div className="stat-item">
          <span>Started</span>
          <span>{DateTime.fromISO(goal.created_at).toFormat('LLL dd, yyyy')}</span>
        </div>
        {daysUntilDue() !== null && (
          <div className="stat-item">
            <span>Due in</span>
            <span className={daysUntilDue() < 5 ? 'urgent' : ''}>
              {daysUntilDue()} days
            </span>
          </div>
        )}
        <div className="stat-item">
          <span>Completed</span>
          <span className="completed-count">
            {goal.checkups?.filter(c => c.status === 'done').length || 0}
          </span>
        </div>
        <div className="stat-item">
          <span>Success Rate</span>
          <span className="success-rate">{calculateProgress()}%</span>
        </div>
      </div>

      <div className="checkup-actions">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add notes (optional)"
          disabled={isSubmitting}
        />
        <div className="status-buttons">
          <button
            className="status-button done"
            onClick={() => handleStatusUpdate('done')}
            disabled={isSubmitting}
          >
            ✓ Done
          </button>
          <button
            className="status-button in-progress"
            onClick={() => handleStatusUpdate('in-progress')}
            disabled={isSubmitting}
          >
            ⟳ In Progress
          </button>
          <button
            className="status-button not-worked"
            onClick={() => handleStatusUpdate('not-worked')}
            disabled={isSubmitting}
          >
            ✕ Not Worked
          </button>
        </div>
      </div>

      <div className="checkups-history">
        <h3>History</h3>
        {goal.checkups?.length > 0 ? (
          <div className="checkups-list">
            {[...goal.checkups].reverse().map((checkup, i) => (
              <div key={i} className="checkup-entry">
                <div className="checkup-header">
                  <span className="checkup-date">
                    {DateTime.fromISO(checkup.date).toFormat('LLL dd, yyyy')}
                  </span>
                  <span className={`checkup-status ${checkup.status}`}>
                    {checkup.status}
                  </span>
                </div>
                {checkup.notes && (
                  <p className="checkup-notes">{checkup.notes}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-checkups">No checkups yet</p>
        )}
      </div>
    </div>
  )
}

export default CheckupView 