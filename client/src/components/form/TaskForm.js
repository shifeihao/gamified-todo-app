import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext';

// 任务表单组件（仅展示分类、截止日期、描述、子任务；仅长期任务显示子任务区）
export const TaskForm = ({
  onSubmit,
  initialData = null,
  onCancel,
  loading = false,
  taskType
}) => {
  const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    category: initialData?.category || '默认',
    dueDate: initialData?.dueDate
      ? new Date(initialData.dueDate).toISOString().split('T')[0]
      : '',
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

  // 通用字段变更
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // 添加子任务
  const handleAddSub = () => {
    if (!subTaskTitle.trim()) {
      setErrors(prev => ({ ...prev, subTaskTitle: '请输入子任务标题' }));
      return;
    }
    const newSub = {
      title: subTaskTitle,
      status: '待完成',
      dueDate: subTaskDueDate || null
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
    if (taskType === '长期' && formData.subTasks.length === 0) {
      newErrors.subTasks = '长期任务至少需要一个子任务';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交
  const handleSubmit = e => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 分类 & 截止日期 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
          <input
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* 任务描述 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">任务描述</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* 子任务，仅长期任务 */}
      {taskType === '长期' && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium mb-2">子任务</h3>
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
                删除
              </button>
            </div>
          ))}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              type="text"
              value={subTaskTitle}
              onChange={e => setSubTaskTitle(e.target.value)}
              placeholder="输入子任务标题"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                errors.subTaskTitle ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <input
              type="date"
              value={subTaskDueDate}
              onChange={e => setSubTaskDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              type="button"
              onClick={handleAddSub}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
            >
              添加
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
          取消
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          disabled={loading}
        >
          {loading ? '处理中...' : initialData ? '更新任务' : '创建任务'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
