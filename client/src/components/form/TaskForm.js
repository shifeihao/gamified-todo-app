import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import toast from 'react-hot-toast'; // 引入 react-hot-toast

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
      ? new Date(initialData.dueDate).toISOString().split('T')[0]
      : (defaultDueDate || ''),  // 默认使用 defaultDueDate
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
      setFormData(prev => ({ ...prev, dueDate: defaultDueDate }));
    }
  }, [defaultDueDate, initialData]);

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
    // 验证子任务标题
    if (!subTaskTitle.trim()) {
      toast.error('Please enter a subtask title');
      return;
    }

    // 验证子任务截止时间
    if (!subTaskDueDate) {
      toast.error('Please select a subtask deadline');
      return;
    }

    // 验证子任务截止时间不能晚于父任务截止时间
    if (formData.dueDate && new Date(subTaskDueDate) > new Date(formData.dueDate)) {
      toast.error('The subtask deadline cannot be later than the parent task deadline');
      return;
    }
    const newSub = {
      title: subTaskTitle,
      status: 'Pending',
      dueDate: subTaskDueDate || null
    };
    setFormData(prev => ({
      ...prev,
      subTasks: [...prev.subTasks, newSub]
    }));

    toast.success('Subtask added successfully');

    // 清空输入
    setSubTaskTitle('');
    setSubTaskDueDate('');
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
    if (taskType === 'long' && formData.subTasks.length === 0) {
      newErrors.subTasks = 'A long-term task requires at least one subtask';
    }

    // 验证所有子任务的截止时间都在父任务截止时间之前
    if (taskType === 'long' && formData.dueDate) {
      const parentDueDate = new Date(formData.dueDate);
      const invalidSubTasks = formData.subTasks.filter(
        subTask => new Date(subTask.dueDate) > parentDueDate
      );

      if (invalidSubTasks.length > 0) {
        toast.error('There is a subtask deadline that is later than the parent task deadline. Please modify it.');
        return false;
      }
    }

    return true;
  };

  // 提交
  const handleSubmit = e => {
    e.preventDefault();
    if (!validate()) return;
    // 如果存在默认截止日期时间，覆盖表单值
    if (defaultDueDateTime) {
      formData.dueDate = defaultDueDateTime;
    }
    onSubmit(formData);
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Expired Date</label>
          {defaultDueDateTime ? (
            <input
              type="datetime-local"
              step="1"
              value={defaultDueDateTime}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
            />
          ) : (
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          )}
        </div>
      </div>

      {/* 任务描述 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Task Describe</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* 子任务，仅长期任务 */}
      {taskType === 'long' && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium mb-2">Subtask</h3>
          {formData.dueDate && (
            <div className="mb-3 text-sm text-blue-600">
              <span>Parent task deadline: {new Date(formData.dueDate).toLocaleDateString('zh-CN')}</span>
            </div>
          )}
          {formData.subTasks.map((sub, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 mb-2 hover:bg-gray-50"
            >
              <div className="flex items-center flex-grow">
                <span className="font-medium flex-grow mr-2">{sub.title}</span>
                <span className="text-sm text-gray-500 ml-auto min-w-[120px] text-right">
                  {new Date(sub.dueDate).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleRemoveSub(idx);
                  toast.success('Subtask deleted');
                }}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                Delete
              </button>
            </div>
          ))}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mt-4">
            <div className="flex flex-col md:col-span-7">
              <input
                type="text"
                value={subTaskTitle}
                onChange={e => setSubTaskTitle(e.target.value)}
                placeholder="Enter a subtask title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex flex-col md:col-span-3">
              <input
                type="date"
                value={subTaskDueDate}
                onChange={e => setSubTaskDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAddSub}
              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-2 rounded md:col-span-2 text-sm flex items-center justify-center"
            >
              <span>Add</span>
            </button>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={() => {
            onCancel();
            toast('Operation canceled');
          }}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
            Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          disabled={loading}
        >
          {loading ? 'Handling...' : initialData ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
};
