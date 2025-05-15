// src/components/form/TaskForm.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tooltip } from '../base/Tooltip';
import { PlusCircle, Trash2, Save, XCircle, CalendarDays, Clock, Info, X} from 'lucide-react';
import toast from 'react-hot-toast';

export const TaskForm = ({
  onSubmit,
  onCancel,
  loading = false,
  initialData = null,
  taskType = 'short',
  defaultDueDateTime = '',
  disableSubmit = false,
  onChange = null
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subTasks, setSubTasks] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState({});

  // Create a reference to store the last form data JSON
  const prevFormDataRef = useRef(null);

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

  // Notify parent component of form value changes
  useEffect(() => {
    // Prevent updates from being triggered when initialization or null values are present
    if (!onChange || !title.trim()) return;
    
    // Prepare the current form data
    const formData = {
      title: title.trim(),
      description: description.trim(),
      subTasks: subTasks.map(st => ({
        title: st.title,
        dueDate: st.dueDate ? new Date(st.dueDate).toISOString() : null
      })),
      dueDate,
      status: initialData?.status || 'pending'
    };
    
    // Using deep comparison to prevent infinite loops
    const formDataJSON = JSON.stringify(formData);
    
    if (formDataJSON !== prevFormDataRef.current) {
      prevFormDataRef.current = formDataJSON;
      
      // Prevent frequent updates and add anti-shake
      const timeoutId = setTimeout(() => {
        onChange(formData);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [title, description, subTasks, dueDate, initialData?.status, onChange]);

  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Task title cannot be empty';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addSubTask = () => {
    setSubTasks(prev => [
      ...prev,
      { id: Date.now(), title: '', dueDate: '' }
    ]);
  };

  // Validation subtask - only used when the form is submitted
  const validateSubTasks = () => {
    if (taskType !== 'long') return true;
    
    // Check if there are subtasks
    if (subTasks.length === 0) {
      toast.error(
        <div className="flex items-center">
          <span className="font-medium">Quest Chain requires at least one step</span>
        </div>,
        { duration: 3000, position: 'top-center' }
      );
      return false;
    }

    // Check each subtask
    for (let i = 0; i < subTasks.length; i++) {
      const subTask = subTasks[i];
      
      // Check the title
      if (!subTask.title || subTask.title.trim() === '') {
        toast.error(
          <div className="flex items-center">
            
            <span className="font-medium">Step {i+1} requires a title</span>
          </div>,
          { duration: 3000, position: 'top-center' }
        );
        return false;
      }
      
      // Check deadline
      if (!subTask.dueDate) {
        toast.error(
          <div className="flex items-center">
            
            <span className="font-medium">Step {i+1} requires a deadline</span>
          </div>,
          { duration: 3000, position: 'top-center' }
        );
        return false;
      }
    }
    
    return true;
  };

  const updateSubTask = (index, field, value) => {
    // No more instant verification, only status update
    setSubTasks(prev =>
      prev.map((st, i) => (i === index ? { ...st, [field]: value } : st))
    );
  };

  const removeSubTask = index => {
    setSubTasks(prev => prev.filter((_, i) => i !== index));
  };

  const isButtonDisabled = loading || disableSubmit;

  // Modify date rendering and update logic
  const renderDueDate = () => {
    if (taskType === 'short') {
      return getTomorrowDate();
    }
    return dueDate;
  };

  const handleSubmit = e => {
    e.preventDefault();
    
    // Validate the main form
    if (!validateForm()) return;
    
    // Verify subtask
    if (!validateSubTasks()) return;
    
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg">
        <div className="mb-4">
          <label htmlFor="title" className="block mb-1 font-medium text-gray-700">Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter task title"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block mb-1 font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            rows="3"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Enter task description (optional)"
            className="w-full px-3 py-2 border rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg">
        <h3 className="font-medium mb-2 text-gray-700">Schedule</h3>
        <div className="flex items-center mb-4">
          <CalendarDays className="mr-2 h-5 w-5 text-gray-500" />
          <label htmlFor="dueDate" className="font-medium text-gray-700">Due Date</label>
        </div>
        <input
          id="dueDate"
          type="date"
          value={renderDueDate()}
          onChange={e => {
            if (taskType !== 'short') {
              setDueDate(e.target.value);
            }
          }}
          className="w-full px-3 py-2 border rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          disabled={taskType === 'short'}
          min={getTomorrowDate()}
        />
        {taskType === 'short' && (
          <div className="flex items-center mt-2 text-gray-600 text-sm">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span>Daily quests are valid for 24 hours after being equipped</span>
          </div>
        )}
      </div>

      {taskType === 'long' && (
        <div className="bg-white rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-700">Quest Steps</h3>
            <button 
              type="button" 
              onClick={addSubTask} 
              className="text-blue-600 hover:text-blue-700 flex items-center text-sm font-medium"
            >
              <PlusCircle className="mr-1 h-4 w-4" /> Add Step
            </button>
          </div>
          
          {subTasks.length === 0 && (
            <div className="text-gray-500 text-sm p-4 bg-gray-50 rounded-md border border-dashed border-gray-300 text-center mb-4">
              No quest steps yet. Add steps to break down your quest into manageable parts.
            </div>
          )}
          
          <div className="space-y-3">
            {subTasks.map((st, i) => (
              <div key={st.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex-grow">
                  <input
                    type="text"
                    value={st.title}
                    onChange={e => updateSubTask(i, 'title', e.target.value)}
                    placeholder={`Step ${i+1}`}
                    className="w-full px-3 py-2 border rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 mb-2"
                  />
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-xs text-gray-600 mr-2">Deadline:</span>
                    <input
                      type="date"
                      value={st.dueDate?.split('T')[0] || ''}
                      onChange={e => {
                        const newValue = e.target.value;
                        updateSubTask(i, 'dueDate', newValue);
                      }}
                      className="text-sm px-2 py-1 border rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      min={getTomorrowDate()}
                      max={dueDate || undefined}
                    />
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => removeSubTask(i)}
                  className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                  title="Remove step"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={loading} 
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
          >
            <XCircle className="h-4 w-4 mr-1" /> Back
          </button>
        )}
        <button 
          type="submit" 
          disabled={isButtonDisabled} 
          className={`px-4 py-2 rounded-md shadow-sm text-white flex items-center ${
            isButtonDisabled 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
          title={disableSubmit ? 'You must select a card to create a task' : ''}
        >
          {loading ? (
            <>Processing...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-1"/> 
              {initialData ? 'Save Changes' : 'Create Task'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};
