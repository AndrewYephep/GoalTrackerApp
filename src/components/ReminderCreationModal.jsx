import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { supabaseClient } from '../utils/supabaseClient';

const ReminderCreationModal = ({ onClose, onReminderCreated, user }) => {
    const [title, setTitle] = useState('');
    const [frequency, setFrequency] = useState('one-time');
    const [weeklyDays, setWeeklyDays] = useState([]);
    const [reminderDate, setReminderDate] = useState('');
    const [reminderTime, setReminderTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [reminders, setReminders] = useState([]);

    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        console.log('Current user in ReminderCreationModal:', user); // Debug log
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (!user?.id) {
                throw new Error('Please sign in to create reminders');
            }

            const newReminder = {
                title: title.trim(),
                frequency,
                weekly_days: frequency === 'weekly' ? weeklyDays : [], // Match schema column name
                reminder_date: frequency === 'one-time' 
                    ? DateTime.fromISO(`${reminderDate}T${reminderTime}`).toISO()
                    : null, // Only set for one-time reminders
                user_id: user.id,
                created_at: DateTime.now().toISO()
            };

            const { data, error: supabaseError } = await supabaseClient
                .from('reminders')
                .insert([newReminder])
                .select()
                .single();

            if (supabaseError) throw supabaseError;

            if (data) {
                onReminderCreated(data);
                onClose();
            }
        } catch (err) {
            console.error('Error creating reminder:', err);
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const loadReminders = async () => {
            if (user) {
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
            }
        };

        loadReminders();
    }, [user]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Create New Reminder</h3>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="title">Title</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="frequency">Frequency</label>
                        <select
                            id="frequency"
                            value={frequency}
                            onChange={(e) => {
                                setFrequency(e.target.value);
                                if (e.target.value !== 'weekly') {
                                    setWeeklyDays([]);
                                }
                            }}
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
                    <div className="modal-buttons">
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Reminder'}
                        </button>
                        <button type="button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReminderCreationModal;