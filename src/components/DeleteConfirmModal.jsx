import React from 'react';

const DeleteConfirmModal = ({ itemType, itemTitle, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="delete-confirm-modal" onClick={e => e.stopPropagation()}>
        <h3>Delete {itemType}</h3>
        <p>Are you sure you want to delete "{itemTitle}"?</p>
        <p className="warning">This action cannot be undone.</p>
        <div className="button-group">
          <button className="cancel-button" onClick={onCancel}>Cancel</button>
          <button className="delete-button" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
