import React, { useState } from 'react';
import TaskCard from './TaskCard';

const TaskRepository = ({
                          tasks,
                          onComplete,
                          onDelete,
                          onEdit,
                          onEquip
                        }) => {
  // 只取未装备的任务（包括已完成）
  const unequippedTasks = tasks.filter(t => !t.equipped);

  // 本地状态：搜索、分类、类型、排序
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedType, setSelectedType] = useState('全部');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // 分类与类型选项
  const categories = ['全部', ...new Set(unequippedTasks.map(t => t.category))];
  const types = ['全部', '短期', '长期'];

  // 拖拽开始
  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('task', JSON.stringify(task));
    e.currentTarget.classList.add('opacity-50');
  };
  // 拖拽结束
  const handleDragEnd = e => {
    e.currentTarget.classList.remove('opacity-50');
  };

  // 过滤 + 排序
  const filtered = unequippedTasks
      .filter(task => {
        if (
            searchTerm &&
            !task.title.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }
        if (selectedCategory !== '全部' && task.category !== selectedCategory) {
          return false;
        }
        if (selectedType !== '全部' && task.type !== selectedType) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA, valB;
        if (sortBy === 'dueDate') {
          valA = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000);
          valB = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000);
        } else if (sortBy === 'priority') {
          const map = { 高: 3, 中: 2, 低: 1 };
          valA = map[a.priority];
          valB = map[b.priority];
        } else if (sortBy === 'experienceReward') {
          valA = a.experienceReward;
          valB = b.experienceReward;
        } else {
          valA = new Date(a[sortBy]);
          valB = new Date(b[sortBy]);
        }
        if (sortOrder === 'asc') {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });

  return (
      <div className="mb-8">
        {/* 搜索与过滤 */}
        <div className="card mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 搜索 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                搜索任务
              </label>
              <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="输入任务标题..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
              />
            </div>
            {/* 分类 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类
              </label>
              <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
              >
                {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                ))}
              </select>
            </div>
            {/* 类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                任务类型
              </label>
              <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
              >
                {types.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                ))}
              </select>
            </div>
            {/* 排序 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                排序方式
              </label>
              <div className="flex">
                <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none"
                >
                  <option value="createdAt">创建时间</option>
                  <option value="dueDate">截止日期</option>
                  <option value="priority">优先级</option>
                  <option value="experienceReward">经验值奖励</option>
                </select>
                <button
                    onClick={() =>
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                    }
                    className="px-3 py-2 border border-gray-300 border-l-0 rounded-r-md bg-gray-50 hover:bg-gray-100"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 任务列表展示 */}
        {filtered.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-gray-500">没有找到匹配的任务</p>
            </div>
        ) : (
            <div className="flex flex-col space-y-4">
              {filtered.map(task => (
                  <div
                      key={task._id}
                      draggable
                      onDragStart={e => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                  >
                    <TaskCard
                        task={task}
                        onComplete={onComplete}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onEquip={onEquip}
                    />
                  </div>
              ))}
            </div>
        )}
      </div>
  );
};

export default TaskRepository;
