import React, { useState, useEffect, useMemo } from 'react'
import { DateTime } from 'luxon'
import { supabaseClient } from '../utils/supabaseClient'
import EnhancedGoalCard from './EnhancedGoalCard'
import CheckupModal from './CheckupModal'

const Calendar = ({ 
  goals, 
  viewMode, 
  onChangeViewMode, 
  currentDate = DateTime.now(),   
  selectedGoal,
  setSelectedGoal,
  setGoals,
  user,
  onChangeDate,
  reminders
}) => {
  const [draggedGoal, setDraggedGoal] = useState(null)
  const [hoveredDate, setHoveredDate] = useState(null)
  const [showGoalDetails, setShowGoalDetails] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [newCheckupNote, setNewCheckupNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkupModal, setCheckupModal] = useState({
    visible: false,
    date: null
  })
  const [showSettings, setShowSettings] = useState(false)
  const [goalToEdit, setGoalToEdit] = useState(null)
  const [weekFilter, setWeekFilter] = useState({ type: 'all', content: 'all' })
  const [currentWeekStart, setCurrentWeekStart] = useState(currentDate.startOf('week'))
  const [calendarReminders, setCalendarReminders] = useState([]);

  useEffect(() => {
    const loadReminders = async () => {
      if (user) {
        try {
          const { data, error } = await supabaseClient
            .from('reminders')
            .select('*')
            .eq('user_id', user.id);
          
          if (error) throw error;
          setCalendarReminders(data);
        } catch (err) {
          console.error('Error loading reminders:', err);
        }
      }
    };
    
    loadReminders();
  }, [user, reminders]); // Reload when reminders change

  const handleDragStart = (e, goal) => {
    setDraggedGoal(goal)
    e.dataTransfer.setData('text/plain', goal.id)
  }

  const handleDragOver = (e, date) => {
    e.preventDefault()
    setHoveredDate(date)
  }

  const handleDrop = async (e, date) => {
    e.preventDefault()
    if (!draggedGoal) return

    try {
      const { error } = await supabaseClient
        .from('goals')
        .update({ dueDate: date.toISODate() })
        .eq('id', draggedGoal.id)

      if (error) throw error

      setGoals(goals.map(g => 
        g.id === draggedGoal.id 
          ? { ...g, dueDate: date.toISODate() }
          : g
      ))
    } catch (err) {
      console.error('Error updating goal date:', err)
      alert('Failed to update goal date')
    }

    setDraggedGoal(null)
    setHoveredDate(null)
  }

  const handleDayClick = (date) => {
    if (date > DateTime.now() || !selectedGoal) return
    setCheckupModal({ visible: true, date })
  }

  const getGoalsForDay = (date) => {
    return goals.filter(goal => {
      const dueDate = DateTime.fromISO(goal.dueDate)
      const isRecurring = goal.frequency === 'weekly' && goal.weeklyDays?.includes(date.toFormat('cccc'))
      return dueDate.hasSame(date, 'day') || isRecurring
    })
  }

  const getRemindersByDate = (date) => {
    const currentDateTime = DateTime.now();
    
    return calendarReminders.filter(reminder => {
      // For one-time reminders
      if (reminder.frequency === 'one-time') {
        const reminderDateTime = DateTime.fromISO(reminder.reminder_date);
        return reminderDateTime.hasSame(date, 'day');
      }
      
      // For daily reminders, only show on the current day
      if (reminder.frequency === 'daily') {
        return date.hasSame(currentDateTime, 'day');
      }
      
      // For weekly reminders
      if (reminder.frequency === 'weekly') {
        // Only show for current and future weeks
        if (date.startOf('day') < currentDateTime.startOf('day')) {
          return false;
        }
        return reminder.weekly_days.includes(date.toFormat('cccc'));
      }
      
      return false;
    });
  };

  const renderReminderTag = (reminder) => {
    let reminderText = reminder.title;
    
    // Add time for one-time reminders
    if (reminder.frequency === 'one-time') {
      const reminderTime = DateTime.fromISO(reminder.reminder_date).toFormat('HH:mm');
      reminderText = `${reminderText} (${reminderTime})`;
    }

    return (
      <div 
        key={`reminder-${reminder.id}`} 
        className={`reminder-tag ${reminder.frequency}`}
        title={`${reminder.title} - ${reminder.frequency}`}
      >
        {reminderText}
      </div>
    );
  };

  const handleCheckupSubmit = async (goal, status) => {
    setIsSubmitting(true)
    try {
      const newCheckup = {
        date: selectedDay.toISO(),
        status,
        notes: newCheckupNote.trim()
      }

      const updatedCheckups = [...(goal.checkups || []), newCheckup]

      const { error } = await supabaseClient
        .from('goals')
        .update({ checkups: updatedCheckups })
        .eq('id', goal.id)

      if (error) throw error

      // Update local state
      setGoals(goals.map(g => 
        g.id === goal.id ? { ...g, checkups: updatedCheckups } : g
      ))
      setNewCheckupNote('')
    } catch (err) {
      console.error('Error adding checkup:', err)
      alert('Failed to add checkup')
    }
    setIsSubmitting(false)
  }

  const handleWeekChange = (direction) => {
    setCurrentWeekStart(prev => direction === 'next' ? prev.plus({ days: 7 }) : prev.minus({ days: 7 }));
  };

  const renderDay = (day) => {
    const dayReminders = getRemindersByDate(day);
    const isSelected = selectedDay && day.hasSame(selectedDay, 'day');
    const hasCheckup = selectedGoal && getDayCheckup(selectedGoal, day);

    return (
      <div 
        className={`calendar-day ${isSelected ? 'selected' : ''}`}
        onClick={() => handleDayClick(day)}
      >
        <span className="day-number">{day.day}</span>
        {hasCheckup && <div className={`checkup-marker ${hasCheckup.status}`} />}
        <div className="reminder-container">
          {dayReminders.map(reminder => renderReminderTag(reminder))}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const daysInMonth = currentDate.daysInMonth;
    const firstDayOfMonth = currentDate.startOf('month');
    const startingDayOfWeek = firstDayOfMonth.weekday % 7;

    const weeks = [];
    let week = new Array(7).fill(null);

    // Fill in the first week's empty days
    for (let i = 0; i < startingDayOfWeek; i++) {
      week[i] = null;
    }

    // Fill in the days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = (startingDayOfWeek + day - 1) % 7;
      const date = currentDate.set({ day });

      // Get checkup for this day if goal is selected
      let dayCheckup = null;
      if (selectedGoal) {
        dayCheckup = selectedGoal.checkups?.find(c =>
          DateTime.fromISO(c.date).hasSame(date, 'day')
        );
      }

      const dayGoals = getGoalsForDay(date);
      const dayReminders = getRemindersByDate(date);

      week[dayOfWeek] = {
        number: day,
        date,
        checkup: dayCheckup,
        isPast: date <= DateTime.now(),
        isToday: date.hasSame(DateTime.now(), 'day')
      };

      if (dayOfWeek === 6 || day === daysInMonth) {
        weeks.push([...week]);
        week = new Array(7).fill(null);
      }
    }

    return (
      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="calendar-day-header">{day}</div>
        ))}

        {weeks.map((week, weekIndex) => (
          week.map((day, dayIndex) => {
            if (!day) return <div key={`${weekIndex}-${dayIndex}`} className="calendar-day empty" />;

            const { number, date, isPast, isToday } = day;
            const dayGoals = selectedGoal ? [selectedGoal] : getGoalsForDay(date);
            const dayReminders = getRemindersByDate(date);

            // Get checkup status for the day if a goal is selected
            let dayStatus = '';
            if (selectedGoal) {
              const checkup = selectedGoal.checkups?.find(c =>
                DateTime.fromISO(c.date).hasSame(date, 'day')
              );
              dayStatus = checkup?.status || '';
            }

            return (
              <div
              key={`${weekIndex}-${dayIndex}-${date.toISO()}`}
              className={`calendar-day ${isToday ? 'today' : ''}
                ${!isPast ? 'future' : ''} ${dayStatus}`}
              onClick={() => isPast && handleDayClick(date)}
              >
              <div className="day-number">{number}</div>
              <div className="day-goals">
                {dayGoals.map(goal => {
                const dayCheckup = goal.checkups?.find(c =>
                  DateTime.fromISO(c.date).hasSame(date, 'day')
                );

                return (
                  <div
                  key={goal.id}
                  className={`goal-indicator ${goal.type}`}
                  draggable={!selectedGoal}
                  onDragStart={(e) => !selectedGoal && handleDragStart(e, goal)}
                  title={dayCheckup ? dayCheckup.notes : ''}
                  >
                  {dayCheckup ? (
                    <span className="checkup-preview">
                    {dayCheckup.notes.slice(0, 20)}
                    {dayCheckup.notes.length > 20 && '...'}
                    </span>
                  ) : null}
                  </div>
                );
                })}
                {dayReminders.map(reminder => (
                <div
                  key={`reminder-${reminder.id}`}
                  className={`reminder-tag ${reminder.frequency}`}
                  style={{
                  padding: '4px 8px',
                  margin: '2px 0',
                  backgroundColor: '#f0f8ff',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  color: '#333',
                  fontWeight: 'bold',
                  }}
                  title={`${reminder.title} - ${reminder.frequency}`}
                >
                  {reminder.title}
                </div>
                ))}
              </div>
              </div>
            );
          })
        ))}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = currentWeekStart;
    const endOfWeek = startOfWeek.plus({ days: 6 });
    const days = Array.from({ length: 7 }, (_, i) => startOfWeek.plus({ days: i }));

    return (
      <div className="week-view">
        <div className="week-grid">
          {days.map(day => {
            const dayGoals = goals.filter(goal => {
              const dueDate = goal.dueDate ? DateTime.fromISO(goal.dueDate) : null;
              const hasCheckups = goal.checkups?.some(checkup => {
                const checkupDate = DateTime.fromISO(checkup.date);
                return checkupDate.hasSame(day, 'day');
              });

              // Include goals that have due dates or checkups for the current day
              return (dueDate && dueDate.hasSame(day, 'day')) || hasCheckups;
            });

            const isEmpty = dayGoals.length === 0; // Check if there are no goals for the day

            return (
              <div key={day.toISODate()} className={`week-day ${isEmpty ? 'empty' : ''}`}>
                <div className="day-header">
                  {day.toLocaleString({ weekday: 'short', day: 'numeric' })}
                </div>
                {dayGoals.map(goal => {
                  const dueDate = goal.dueDate ? DateTime.fromISO(goal.dueDate) : null;
                  const checkups = goal.checkups || [];

                  return (
                    <div
                      key={goal.id}
                      className={`goal-week-card ${goal.type}`}
                    >
                      <div className="goal-title">{goal.title}</div>
                      {dueDate && dueDate.hasSame(day, 'day') && (
                        <div className="due-date status-due-date">
                          Due: {dueDate.toLocaleString(DateTime.TIME_SIMPLE)}
                        </div>
                      )}
                      {checkups
                        .filter(checkup => {
                          const checkupDate = DateTime.fromISO(checkup.date);
                          return checkupDate.hasSame(day, 'day');
                        })
                        .map((checkup, index) => (
                          <div key={index}>
                            <span className="checkup-date">
                              {DateTime.fromISO(checkup.date).toLocaleString(DateTime.TIME_SIMPLE)}:
                            </span>
                            <span className="checkup-status">{checkup.status}: </span>
                            <span className="checkup-notes">{checkup.notes}</span>
                          </div>
                        ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayGoals = goals.filter(goal => {
      const dueDate = DateTime.fromISO(goal.dueDate)
      return dueDate.hasSame(currentDate, 'day')
    })

    return (
      <div className="day-view">
        <h3>{currentDate.toFormat('cccc, LLLL d')}</h3>
        <div className="day-goals">
          {dayGoals.map(goal => (
            <EnhancedGoalCard 
              key={goal.id}
              goal={goal}
              onEdit={() => {/* Handle edit */}}
              onDelete={() => {/* Handle delete */}}
            />
          ))}
        </div>
      </div>
    )
  }

  const handleEditGoal = (goal) => {
    setGoalToEdit(goal)
    setShowSettings(true)
  }

  useEffect(() => {
    // Logic to update the calendar view based on selectedGoal
    if (selectedGoal) {
      // Perform any necessary updates or side effects
    }
  }, [selectedGoal]);

  return (
    <div className="calendar">
      <div className="calendar-header">
        <div className="calendar-nav">
        <button onClick={() => {
          const newDate = viewMode === 'month' 
            ? currentDate.minus({ months: 1 })
            : viewMode === 'week'
            ? handleWeekChange('previous')
            : currentDate.minus({ days: 1 })
          onChangeDate(newDate)
        }}>
          ←
        </button>
          <h2>
            {viewMode === 'month' 
              ? currentDate.toFormat('MMMM yyyy')
              : viewMode === 'week'
                ? `Week of ${currentWeekStart.toFormat('LLL d')} - ${currentWeekStart.plus({ days: 6 }).toFormat('LLL d, yyyy')}`
                : currentDate.toFormat('cccc, LLLL d')}
          </h2>
          <button onClick={() => {
            const newDate = viewMode === 'month' 
              ? currentDate.plus({ months: 1 })
              : viewMode === 'week'
              ? handleWeekChange('next')
              : currentDate.plus({ days: 1 })
            onChangeDate(newDate)
          }}>
            →
          </button>
        </div>

        <div className="view-controls">
          <button 
            className={viewMode === 'month' ? 'active' : ''}
            onClick={() => onChangeViewMode('month')}
          >
            Month
          </button>
          <button 
            className={viewMode === 'week' ? 'active' : ''}
            onClick={() => onChangeViewMode('week')}
          >
            Week
          </button>
          <button 
            className={viewMode === 'day' ? 'active' : ''}
            onClick={() => onChangeViewMode('day')}
          >
            Day
          </button>
        </div>
      </div>

      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}

      {checkupModal.visible && selectedGoal && (
        <CheckupModal
          goal={selectedGoal}
          date={checkupModal.date}
          onClose={() => setCheckupModal({ visible: false, date: null })}
          onUpdate={(updatedGoal) => {
            setGoals(prevGoals => 
              prevGoals.map(g => g.id === updatedGoal.id ? updatedGoal : g)
            );
            setSelectedGoal(updatedGoal);
            setCheckupModal({ visible: false, date: null });
          }}
        />
      )}

      {showSettings && goalToEdit && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          goal={goalToEdit}
          onUpdate={(updatedGoal) => {
            setGoals(prevGoals => 
              prevGoals.map(g => g.id === updatedGoal.id ? updatedGoal : g)
            );
            setGoalToEdit(null);
            setShowSettings(false);
          }}
        />
      )}

    </div>
  )
}

export default Calendar