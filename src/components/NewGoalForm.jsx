import React, { useState } from 'react'
import { DateTime } from 'luxon'
import { supabaseClient } from '../utils/supabaseClient'

const NewGoalForm = ({ onClose, onGoalCreated }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState('one-time')
  const [type, setType] = useState('goal')
  const [weeklyDays, setWeeklyDays] = useState([])
  const [priority, setPriority] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (!title.trim()) {
        throw new Error('Title is required')
      }

      const newGoal = {
        title: title.trim(),
        description: description.trim(),
        frequency,
        type,
        weeklyDays: frequency === 'weekly' ? weeklyDays : [],
        priority,
        dueDate: dueDate || null,
        created_at: DateTime.now().toISO(),
        user_id: (await supabaseClient.auth.getUser()).data.user.id,
        checkups: []
      }

      const { data, error: dbError } = await supabaseClient
        .from('goals')
        .insert([newGoal])
        .select()

      if (dbError) throw dbError

      onGoalCreated(data[0])
      onClose()
    } catch (err) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="new-goal-form">
        <h3>Create New Goal</h3>

        {error && (
          <div className="error-message">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              placeholder="Goal Name"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows="2"
              placeholder="Optional description"
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="goal">Goal</option>
              <option value="task">Task</option>
              <option value="project">Project</option>
            </select>
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
                {weekdays.map(day => (
                  <label key={day} className="weekday-checkbox">
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
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? 'Creating...' : 'Create Goal'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default NewGoalForm 