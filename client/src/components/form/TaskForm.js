import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext';

// 日期格式轉換函數
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// 將 dd-mm-yyyy 轉換為 yyyy-mm-dd
const parseDate = (dateString) => {
  if (!dateString) return '';
  const [day, month, year] = dateString.split('-');
  return `${year}-${month}-${day}`;
};

// 任务表单组件（仅展示分类、截止日期、描述、子任务；仅长期任务显示子任务区）
export const TaskForm = ({
                           onSubmit,
                           initialData = null,
                           onCancel,
                           loading = false,
                           taskType,
                           defaultDueDate,      // 新增：默认截止日期（YYYY-MM-DD）
                           defaultDueDateTime   // 新增：默认截止日期时间（YYYY-MM-DDTHH:mm）
                         }) => {
  const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    category: initialData?.category || 'Default',
    dueDate: initialData?.dueDate
        ? formatDate(initialData.dueDate)
        : (defaultDueDate ? formatDate(defaultDueDate) : ''),
    baseExperience: 10,
    baseGold: 5,
    description: initialData?.description || '',
    subTasks: initialData?.subTasks || []
  });
  const [subTaskTitle, setSubTaskTitle] = useState('');
  const [subTaskDueDate, setSubTaskDueDate] = useState('');
  const [errors, setErrors] = useState({});

  // 如果有初始子任务，填充
  useEffect(() => {
    if (initialData?.subTasks) {
      setFormData(prev => ({ ...prev, subTasks: initialData.subTasks }));
    }
  }, [initialData]);

  // 如果没有 initialData 且 defaultDueDate 提供，设置截止日期
  useEffect(() => {
    if (!initialData && defaultDueDate) {
      setFormData(prev => ({ ...prev, dueDate: formatDate(defaultDueDate) }));
    }
  }, [defaultDueDate, initialData]);

  // 通用字段变更
  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'dueDate') {
      setFormData(prev => ({ ...prev, [name]: formatDate(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // 添加子任务
  const handleAddSub = () => {
    if (!subTaskTitle.trim()) {
      setErrors(prev => ({ ...prev, subTaskTitle: 'Please enter a subtask title' }));
      return;
    }
    const newSub = {
      title: subTaskTitle,
      status: 'Unfinished',
      dueDate: subTaskDueDate ? formatDate(subTaskDueDate) : null
    };
    setFormData(prev => ({
      ...prev,
      subTasks: [...prev.subTasks, newSub]
    }));
    setSubTaskTitle('');
    setSubTaskDueDate('');
    setErrors(prev => ({ ...prev, subTaskTitle: null }));
  };

  // 删除子任务
  const handleRemoveSub = index => {
    setFormData(prev => {
      const subs = [...prev.subTasks];
      subs.splice(index, 1);
      return { ...prev, subTasks: subs };
    });
  };

  // 校验
  const validate = () => {
    const newErrors = {};
    if (taskType === 'Long' && formData.subTasks.length === 0) {
      newErrors.subTasks = 'A long-term task requires at least one subtask';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交
  const handleSubmit = e => {
    e.preventDefault();
    if (!validate()) return;

    // 準備提交的數據
    const submitData = {
      ...formData,
      dueDate: defaultDueDateTime || parseDate(formData.dueDate)
    };

    onSubmit(submitData);
  };

  return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 分类 & 截止日期 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
            <input
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiration date</label>
            {defaultDueDateTime ? (
                <input
                    type="datetime-local"
                    step="1"
                    value={defaultDueDateTime}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                />
            ) : (
                <div className="relative" style={{ minHeight: '40px' }}>
                  <input
                      type="date"
                      name="dueDate"
                      value={parseDate(formData.dueDate)}
                      onChange={handleChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      style={{ color: 'transparent', background: 'transparent' }}
                  />
                  <div
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white flex items-center cursor-pointer"
                      onClick={e => {
                        e.currentTarget.previousSibling?.focus();
                      }}
                  >
                    <span className="text-black">{formData.dueDate || ''}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
            )}
          </div>
        </div>

        {/* 任务描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Task Description</label>
          <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* 子任务，仅长期任务 */}
        {taskType === 'Long' && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-md font-medium mb-2">Subtasks</h3>
              {errors.subTasks && (
                  <p className="text-red-500 text-sm mb-2">{errors.subTasks}</p>
              )}
              {formData.subTasks.map((sub, idx) => (
                  <div
                      key={idx}
                      className="flex justify-between items-center p-2 bg-white rounded border border-gray-200 mb-2"
                  >
                    <span>{sub.title}</span>
                    <button
                        type="button"
                        onClick={() => handleRemoveSub(idx)}
                        className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
              ))}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                    type="text"
                    value={subTaskTitle}
                    onChange={e => setSubTaskTitle(e.target.value)}
                    placeholder="Enter a subtask title"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                        errors.subTaskTitle ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                <div className="relative" style={{ minHeight: '40px' }}>
                  <input
                      type="date"
                      value={parseDate(subTaskDueDate)}
                      onChange={e => setSubTaskDueDate(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      style={{ color: 'transparent', background: 'transparent' }}
                  />
                  <div
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white flex items-center cursor-pointer"
                      onClick={e => {
                        e.currentTarget.previousSibling?.focus();
                      }}
                  >
                    <span className="text-black">{subTaskDueDate ? formatDate(subTaskDueDate) : ''}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <button
                    type="button"
                    onClick={handleAddSub}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
                >
                  Add
                </button>
              </div>
            </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-2">
          <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
              type="submit"
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              disabled={loading}
          >
            {loading ? 'Processing...' : initialData ? 'Update Tasks' : 'Create a task'}
          </button>
        </div>
      </form>
  );
};