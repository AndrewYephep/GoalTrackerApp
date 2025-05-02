import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { supabaseClient } from '../utils/supabaseClient';

const GoalCreationSidebar = ({ onClose, onGoalCreated, type }) => {
  console.log('GoalCreationSidebar rendered');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('one-time');
  const [weeklyDays, setWeeklyDays] = useState([]);
  const [priority, setPriority] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!title.trim()) {
        throw new Error('Title is required');
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
      };

      const { data, error: dbError } = await supabaseClient
        .from('goals')
        .insert([newGoal])
        .select();

      if (dbError) throw dbError;

      console.log('New goal created:', data[0]);
      onGoalCreated(data[0]);
      onClose();
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="goal-creation-sidebar">
      <h3>Create New {type.charAt(0).toUpperCase() + type.slice(1)}</h3>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`${type.charAt(0).toUpperCase() + type.slice(1)} Name`}
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="one-time">One-time</option>
        </select>
        {frequency === 'weekly' && (
          <div className="weekday-selector">
            {weekdays.map(day => (
              <label key={day}>
                <input
                  type="checkbox"
                  checked={weeklyDays.includes(day)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setWeeklyDays([...weeklyDays, day]);
                    } else {
                      setWeeklyDays(weeklyDays.filter(d => d !== day));
                    }
                  }}
                />
                {day}
              </label>
            ))}
          </div>
        )}
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <button className='btn-primary' disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : `Create ${type.charAt(0).toUpperCase() + type.slice(1)}`}
        </button>
        <button className='btn-secondary' style={{color: 'black' }}type="button" onClick={() => {
          onClose();
        }}>Cancel</button>
      </form>
    </div>
  );
};

export default GoalCreationSidebar; 