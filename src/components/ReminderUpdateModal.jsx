import React, { useState } from 'react';
import { DateTime } from 'luxon';
import DeleteConfirmModal from './DeleteConfirmModal';
import { supabaseClient } from '../utils/supabaseClient';

const ReminderUpdateModal = ({ reminder, onClose, onUpdate, user }) => {
  const [title, setTitle] = useState(reminder.title);
  const [description, setDescription] = useState(reminder.description);
  const [dueDate, setDueDate] = useState(
    reminder.dueDate ? DateTime.fromISO(reminder.dueDate).toFormat('yyyy-MM-dd') : ''
  );
  const [frequency, setFrequency] = useState(reminder.frequency || 'one-time');
  const [weeklyDays, setWeeklyDays] = useState(reminder.weekly_days || []);
  const [reminderDate, setReminderDate] = useState(
    reminder.reminder_date ? DateTime.fromISO(reminder.reminder_date).toFormat('yyyy-MM-dd') : ''
  );
  const [reminderTime, setReminderTime] = useState(
    reminder.reminder_date ? DateTime.fromISO(reminder.reminder_date).toFormat('HH:mm') : ''
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedReminder = {
      ...reminder,
      title,
      description,
      frequency,
      weekly_days: weeklyDays,
      reminder_date: frequency === 'one-time' && reminderDate && reminderTime
        ? DateTime.fromFormat(`${reminderDate} ${reminderTime}`, 'yyyy-MM-dd HH:mm').toISO()
        : null,
      lastUpdated: DateTime.now().toISO(),
    };

    try {
      const { data, error } = await supabaseClient
        .from('reminders')
        .update(updatedReminder)
        .eq('id', reminder.id)
        .select()
        .single();

      if (error) throw error;
      onUpdate(data);
    } catch (err) {
      console.error('Error updating reminder:', err);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabaseClient
        .from('reminders')
        .delete()
        .eq('id', reminder.id);

      if (error) throw error;
      onClose();
      onUpdate(null);  // Changed to pass null instead of deleted reminder
    } catch (err) {
      console.error('Error deleting reminder:', err);
    }
  };

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h3>Update Reminder</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="frequency">Frequency</label>
              <select
                id="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="one-time">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            {frequency === 'weekly' && (
              <div className="form-group">
                <label>Weekly Days</label>
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
              </div>
            )}

            {frequency === 'one-time' && (
              <>
                <div className="form-group">
                  <label htmlFor="reminderDate">Date</label>
                  <input
                    id="reminderDate"
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reminderTime">Time</label>
                  <input
                    id="reminderTime"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    required
                  />
                </div>
              </>
            )}
            
            <div className="button-group">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Update Reminder
              </button>
              <button 
                type="button" 
                className="delete-button"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Reminder
              </button>
            </div>
          </form>
        </div>
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmModal
          itemType="Reminder"
          itemTitle={title}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
};

export { ReminderUpdateModal as default };
