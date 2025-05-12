// src/components/form/TaskForm.js
import React, { useState, useEffect, useCallback } from 'react';
import { Tooltip } from '../base/Tooltip';
import { PlusCircle, Trash2, Save, XCircle, CalendarDays, Clock, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export const TaskForm = ({
  onSubmit,
  onCancel,
  loading = false,
  initialData = null,
  taskType = 'short',
  defaultDueDateTime = '',
  disableSubmit = false,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subTasks, setSubTasks] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState({});

  const getTomorrowDate = () => {
    const d = new Date();
    d.setHours(d.getHours() + 24);
    return d.toISOString().split('T')[0];
  };

  const getTomorrowTime = () => {
    const d = new Date();
    d.setHours(d.getHours() + 24);
    return d.toTimeString().slice(0,5);
  };

  const initializeForm = useCallback(() => {
    setTitle(initialData?.title || '');
    setDescription(initialData?.description || '');
    setSubTasks(
      initialData?.subTasks?.map(st => ({
        ...st,
        id: st._id || st.id || Date.now() + Math.random()
      })) || []
    );
    let dateValue = '';
    if (initialData?.dueDate) {
      dateValue = new Date(initialData.dueDate).toISOString().split('T')[0];
    } else if (defaultDueDateTime) {
      dateValue = defaultDueDateTime.split('T')[0];
    } else if (taskType === 'short') {
      dateValue = getTomorrowDate();
    }
    setDueDate(dateValue);
    setErrors({});
  }, [initialData, defaultDueDateTime, taskType]);

  useEffect(() => {
    initializeForm();
  }, [initializeForm]);

  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Task title cannot be empty';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!validateForm()) return;
    const processedSubTasks = subTasks.map(st => ({
      title: st.title,
      dueDate: st.dueDate ? new Date(st.dueDate).toISOString() : null
    }));
    const formData = {
      title: title.trim(),
      description: description.trim(),
      subTasks: processedSubTasks,
      dueDate,
      status: initialData?.status || 'pending'
    };
    onSubmit(formData);
  };

  const addSubTask = () => {
    setSubTasks(prev => [
      ...prev,
      { id: Date.now(), title: '', dueDate: '' }
    ]);
  };

  const updateSubTask = (index, field, value) => {
    setSubTasks(prev =>
      prev.map((st, i) => (i === index ? { ...st, [field]: value } : st))
    );
  };

  const removeSubTask = index => {
    setSubTasks(prev => prev.filter((_, i) => i !== index));
  };

  const isButtonDisabled = loading || disableSubmit;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <label htmlFor="title" className="block mb-1 font-medium">Title *</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className={`w-full px-3 py-2 border rounded ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
        <label htmlFor="description" className="block mt-4 mb-1 font-medium">Description</label>
        <textarea
          id="description"
          rows="3"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded border-gray-300"
        />
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="font-medium mb-2">Schedule</h3>
        <label htmlFor="dueDate" className="block mb-1 flex items-center">
          <CalendarDays className="mr-2" /> Due Date
        </label>
        <input
          id="dueDate"
          type="date"
          value={taskType === 'short' ? getTomorrowDate() : dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="w-full px-3 py-2 border rounded border-gray-300"
          disabled={taskType === 'short'}
        />
        {taskType === 'short' && (
          <p className="text-gray-500 text-sm mt-1">Valid for 24 hours after being equipped</p>
        )}
      </div>

      {taskType === 'long' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Subtasks</h3>
            <button type="button" onClick={addSubTask} className="text-primary-600 flex items-center">
              <PlusCircle className="mr-1" /> Add
            </button>
          </div>
          {subTasks.length === 0 && <p className="text-gray-500 text-sm">No subtasks yet</p>}
          <div className="space-y-2">
            {subTasks.map((st, i) => (
              <div key={st.id} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={st.title}
                  onChange={e => updateSubTask(i, 'title', e.target.value)}
                  placeholder={`Step ${i+1}`}
                  className="flex-grow px-3 py-2 border rounded border-gray-300"
                />
                <input
                  type="datetime-local"
                  value={st.dueDate || ''}
                  onChange={e => updateSubTask(i, 'dueDate', e.target.value)}
                  className="px-3 py-2 border rounded border-gray-300"
                />
                <button type="button" onClick={() => removeSubTask(i)}>
                  <Trash2 />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={loading} className="px-4 py-2 border rounded">
            <XCircle className="inline mr-1" /> Cancel
          </button>
        )}
        <button 
          type="submit" 
          disabled={isButtonDisabled} 
          className={`px-4 py-2 text-white rounded flex items-center ${isButtonDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
          title={disableSubmit ? 'You must select a card to create a task' : ''}
        >
          {loading ? 'Processing...' : (<><Save className="inline mr-1"/> {initialData ? 'Save' : 'Create'}</>)}
        </button>
      </div>
    </form>
  );
};
