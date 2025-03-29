import React, { useState } from 'react'
import { DateTime } from 'luxon'
import { supabaseClient } from '../utils/supabaseClient'

const CheckupModal = ({ 
  goal, 
  date, 
  onClose, 
  onUpdate 
}) => {
  const existingCheckup = goal.checkups?.find(c => 
    DateTime.fromISO(c.date).hasSame(date, 'day')
  )

  const [notes, setNotes] = useState(existingCheckup?.notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (status) => {
    setIsSubmitting(true)
    try {
      const newCheckup = {
        date: date.toISO(),
        status,
        notes: notes.trim()
      }

      // Filter out any existing checkup for this date
      const updatedCheckups = [...(goal.checkups || [])]
      const existingIndex = updatedCheckups.findIndex(c => 
        DateTime.fromISO(c.date).hasSame(date, 'day')
      )
      
      if (existingIndex !== -1) {
        updatedCheckups[existingIndex] = newCheckup
      } else {
        updatedCheckups.push(newCheckup)
      }

      // Update the goal in the database
      const { data, error } = await supabaseClient
        .from('goals')
        .update({ checkups: updatedCheckups })
        .eq('id', goal.id)
        .select()

      if (error) throw error
      if (!data?.[0]) throw new Error('No data returned from update')

      onUpdate(data[0])
      onClose()
    } catch (err) {
      console.error('Error updating checkup:', err)
      alert('Failed to update checkup: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="checkup-modal">
        <h3>
          {goal.title} - {date.toFormat('LLL dd, yyyy')}
        </h3>
        
        {existingCheckup && (
          <div className={`current-status ${existingCheckup.status}`}>
            Current Status: {existingCheckup.status === 'not-worked' ? 'Missed' : existingCheckup.status}
          </div>
        )}

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter your progress notes..."
          disabled={isSubmitting}
        />

        <div className="status-buttons">
          <button
            className="status-button done"
            onClick={() => handleSubmit('done')}
            disabled={isSubmitting}
          >
            <span>✓</span>
            Done
          </button>
          <button
            className="status-button in-progress"
            onClick={() => handleSubmit('in-progress')}
            disabled={isSubmitting}
          >
            <span>⟳</span>
            In Progress
          </button>
          <button
            className="status-button not-worked"
            onClick={() => handleSubmit('not-worked')}
            disabled={isSubmitting}
            style={{backgroundColor: '#ef4444'}}
          >
            <span>✕</span>
            Missed
          </button>
        </div>

        <button 
          className="close-button"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </>
  )
}

export default CheckupModal