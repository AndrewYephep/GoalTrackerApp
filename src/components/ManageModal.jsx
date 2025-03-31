import React, { useState } from 'react';
import { DateTime } from 'luxon';
import SettingsModal from './SettingsModal';
import ReminderUpdateModal from './ReminderUpdateModal';

const ManageModal = ({ type, goals, setGoals, onClose, user, reminders, setReminders }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showReminderUpdate, setShowReminderUpdate] = useState(false);

  const processedReminders = (reminders || []).map(r => ({
    ...r,
    type: 'reminder',
    dueDate: r.reminder_date || r.dueDate
  }));
  console.log("ManageModal - received reminders:", reminders);
  console.log("ManageModal - processedReminders:", processedReminders);
  
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

  const handleItemUpdate = (updatedItem) => {
    if (!updatedItem) {
      // Handle deletion
      if (selectedItem.type === 'reminder') {
        setReminders(prev => prev.filter(r => r.id !== selectedItem.id));
      } else {
        setGoals(prev => prev.filter(g => g.id !== selectedItem.id));
      }
      setSelectedItem(null);
      setShowSettings(false);
      setShowReminderUpdate(false);
    } else {
      // Handle update
      if (updatedItem.type === 'reminder') {
        setReminders(prev => prev.map(r => r.id === updatedItem.id ? updatedItem : r));
      } else {
        setGoals(prev => prev.map(g => g.id === updatedItem.id ? updatedItem : g));
      }
      setSelectedItem(null);
      setShowSettings(false);
      setShowReminderUpdate(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="manage-modal" onClick={(e) => e.stopPropagation()}>
        <div className="manage-modal-header">
          <h2>{type === 'all' ? 'All Items' : `${type.charAt(0).toUpperCase() + type.slice(1)}s`}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="manage-items-grid">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
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
                      {item.frequency === 'one-time' && item.dueDate ? (
                        `Due: ${DateTime.fromISO(item.dueDate).toFormat('LLL dd, yyyy HH:mm')}`
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
            ))
          ) : (
            <p className="empty-message">
              There is nothing here. Please create a {type === 'all' ? 'item' : type} in the sidebar.
            </p>
          )}
        </div>

        {showSettings && selectedItem && (
          <SettingsModal
            isOpen={showSettings}
            onClose={() => {
              setShowSettings(false);
              setSelectedItem(null);
            }}
            goal={selectedItem}
            onUpdate={handleItemUpdate}
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
            onUpdate={handleItemUpdate}
            user={user}
          />
        )}
      </div>
    </div>
  );
};

export default ManageModal;
