import React, { useState } from 'react'

const QuickForm = ({ date, onClose, onSubmit }) => {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('goal')
  const [dueDate, setDueDate] = useState(date?.toISODate())

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      title,
      type,
      dueDate,
      status: 'active',
      created_at: new Date().toISOString()
    })
    onClose()
  }

  return (
    <div className="quick-form">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title"
          autoFocus
        />
        
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="goal">Goal</option>
          <option value="project">Project</option>
          <option value="task">task</option>
        </select>

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <div className="button-group">
          <button type="submit">Add</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

export default QuickForm 