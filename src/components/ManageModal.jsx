import React, { useState } from 'react';
import { DateTime } from 'luxon';
import SettingsModal from './SettingsModal';
import ReminderUpdateModal from './ReminderUpdateModal';

const ManageModal = ({ type, goals, setGoals, onClose, user, reminders }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showReminderUpdate, setShowReminderUpdate] = useState(false);

  // Ensure reminders array exists and add type property
  const processedReminders = (reminders || []).map(r => ({ ...r, type: 'reminder' }));
  
  const filteredItems = type === 'all' 
    ? [...goals, ...processedReminders]
    : type === 'reminder'
      ? processedReminders
      : goals.filter(item => item.type === type);

  const handleEdit = (item) => {
    if (item.type === 'reminder') {
      setShowReminderUpdate(true);
    } else {
      setShowSettings(true);
    }
    setSelectedItem(item);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="manage-modal" onClick={(e) => e.stopPropagation()}>
        <div className="manage-modal-header">
          <h2>{type === 'all' ? 'All Items' : `${type.charAt(0).toUpperCase() + type.slice(1)}s`}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="manage-items-grid">
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              className={`manage-card ${item.type}`}
            >
              <div className="manage-card-header">
                <h3>{item.title}</h3>
                <span className="manage-card-type">{item.type}</span>
              </div>
              
              <p className="manage-card-description">{item.description}</p>
              
              <div className="manage-card-footer">
                {item.type === 'reminder' ? (
                  <span className="manage-card-date">
                    {item.frequency === 'one-time' && item.reminder_date ? (
                      `Due: ${DateTime.fromISO(item.reminder_date).toFormat('LLL dd, yyyy HH:mm')}`
                    ) : (
                      `Frequency: ${item.frequency}`
                    )}
                  </span>
                ) : item.dueDate && (
                  <span className="manage-card-date">
                    Due: {DateTime.fromISO(item.dueDate).toFormat('LLL dd, yyyy')}
                  </span>
                )}
                <button 
                  className="edit-button"
                  onClick={() => handleEdit(item)}
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {showSettings && selectedItem && (
          <SettingsModal
            isOpen={showSettings}
            onClose={() => {
              setShowSettings(false);
              setSelectedItem(null);
            }}
            goal={selectedItem}
            onUpdate={(updatedItem) => {
              setGoals(prevGoals => 
                prevGoals.map(g => g.id === updatedItem.id ? updatedItem : g)
              );
              setShowSettings(false);
              setSelectedItem(null);
            }}
            type={selectedItem.type}
          />
        )}

        {showReminderUpdate && selectedItem && (
          <ReminderUpdateModal
            reminder={selectedItem}
            onClose={() => {
              setShowReminderUpdate(false);
              setSelectedItem(null);
            }}
            onUpdate={(updatedReminder) => {
              // Update reminders instead of goals for reminder items
              if (updatedReminder.type === 'reminder') {
                const reminderUpdateEvent = new CustomEvent('reminderUpdate', {
                  detail: updatedReminder
                });
                window.dispatchEvent(reminderUpdateEvent);
              }
              setShowReminderUpdate(false);
              setSelectedItem(null);
            }}
            user={user}
          />
        )}
      </div>
    </div>
  );
};

export { ManageModal as default };
