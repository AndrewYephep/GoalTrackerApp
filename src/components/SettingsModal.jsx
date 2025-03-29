import React, { useState, useEffect } from 'react'
import { supabaseClient } from '../utils/supabaseClient'

const SettingsModal = ({ isOpen, onClose, goal, onUpdate, type = 'goal' }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState('one-time')
  const [weeklyDays, setWeeklyDays] = useState([])
  const [priority, setPriority] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (goal) {
      setTitle(goal.title)
      setDescription(goal.description)
      setFrequency(goal.frequency)
      setWeeklyDays(goal.weeklyDays)
      setPriority(goal.priority)
      setDueDate(goal.dueDate)
    }
  }, [goal])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const updatedGoal = {
        title,
        description,
        frequency,
        type,
        weeklyDays,
        priority,
        dueDate,
      }

      const { data, error: dbError } = await supabaseClient
        .from('goals')
        .update(updatedGoal)
        .eq('id', goal.id)
        .select()

      if (dbError) throw dbError

      onUpdate(data[0])
      onClose()
    } catch (err) {
      setError(err.message)
      setIsSubmitting(false)
    }
  } 

  if (!isOpen) return null

  // Determine the color based on the type
  const typeColors = {
    goal: { bg: 'var(--goal-modal-bg)', text: 'var(--goal-modal-text)' },     // Solid light blue bg
    task: { bg: 'var(--task-modal-bg)', text: 'var(--task-modal-text)' },     // Solid light purple bg
    project: { bg: 'var(--project-modal-bg)', text: 'var(--project-modal-text)' },  // Solid light green bg
    reminder: { bg: 'var(--reminder-modal-bg)', text: 'var(--reminder-modal-text)' },  // Solid light grey bg
  }

  // Default case to prevent undefined errors
  const currentTypeColor = typeColors[type] || { bg: 'white', text: 'black' }; // Fallback colors

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: currentTypeColor.bg, color: currentTypeColor.text }}>
        <h2>{type.charAt(0).toUpperCase() + type.slice(1)}</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="frequency">Frequency</label>
            <select
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="one-time">One-time</option>
            </select>
          </div>
          {frequency === 'weekly' && (
            <div className="form-group">
              <label>Weekly Days</label>
              <div className="weekday-selector">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <label key={day}>
                    <input
                      type="checkbox"
                      checked={weeklyDays.includes(day)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setWeeklyDays([...weeklyDays, day])
                        } else {
                          setWeeklyDays(weeklyDays.filter(d => d !== day))
                        }
                      }}
                      disabled={isSubmitting}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <input
              id="priority"
              type="number"
              min="0"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value))}
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="button-group">
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Updating...' : 'Update'}
            </button>
            <button type="button" onClick={onClose} disabled={isSubmitting} className="btn btn-secondary" style={{color: 'black'}}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 

export default SettingsModal