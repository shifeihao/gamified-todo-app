import React, { useState } from 'react';
import {TaskCard} from './TaskCard';
import { Filter, Search, ChevronDown, ChevronUp, X, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';

export const TaskRepository = ({
                          tasks,
                          onComplete,
                          onDelete,
                          onEdit,
                          onEquip,
                          isExpanded = true
                        }) => {
  // 只取未装备的任务（包括已完成）
  const unequippedTasks = tasks.filter(t => !t.equipped);

  // 本地状态：搜索、分类、类型、排序
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  // 清除所有筛选条件
  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedType('All');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  // 分类与类型选项
  const categories = ['All', 'Default'];
  const types = ['All', 'short', 'long'];

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
        if (selectedCategory !== 'All' && task.category !== (selectedCategory === 'Default' ? 'Default' : selectedCategory)) {
          return false;
        }
        if (selectedType !== 'All' && task.type !== selectedType) {
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
          const map = { '高': 3, '中': 2, '低': 1 };
          valA = map[a.priority] || 0;
          valB = map[b.priority] || 0;
        } else if (sortBy === 'experienceReward') {
          valA = a.experienceReward || 0;
          valB = b.experienceReward || 0;
        } else {
          valA = new Date(a[sortBy] || Date.now());
          valB = new Date(b[sortBy] || Date.now());
        }
        
        if (sortOrder === 'asc') {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });

  // 获取活跃筛选器数量
  const activeFilterCount = [
    selectedCategory !== 'All',
    selectedType !== 'All',
    sortBy !== 'createdAt' || sortOrder !== 'desc'
  ].filter(Boolean).length;

  return (
      <div className="mb-8">
        {/* 搜索条 */}
        <div className="card mb-4 p-4">
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search for tasks..."
              className="pl-10 pr-10 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="h-full px-3 flex items-center text-gray-500 hover:text-amber-600 relative"
              >
                <Filter size={18} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 筛选面板 - 可折叠 */}
        {showFilters && (
          <div className="flex items-center gap-2 mb-4 bg-gray-50 p-3 rounded-lg">
            {/* 分类筛选 */}
            <div className="flex items-center mr-6">
              <span className="text-sm text-gray-600 mr-2">Category:</span>
              <div className="flex gap-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 rounded-md text-xs transition-colors 
                      ${selectedCategory === cat 
                        ? 'bg-blue-100 text-blue-600 font-medium' 
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 类型筛选 */}
            <div className="flex items-center mr-6">
              <span className="text-sm text-gray-600 mr-2">Type:</span>
              <div className="flex gap-1">
                {types.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-2 py-1 rounded-md text-xs transition-colors 
                      ${selectedType === type 
                        ? 'bg-blue-100 text-blue-600 font-medium' 
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 排序方式 */}
            <div className="flex items-center ml-auto">
              <span className="text-sm text-gray-600 mr-2">Sort By:</span>
              <div className="flex items-center">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs py-1 px-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="createdAt">Created Date</option>
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="experienceReward">Experience</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1 text-gray-500 hover:text-blue-600 ml-1"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? <ArrowUpAZ size={14} /> : <ArrowDownAZ size={14} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 任务列表展示 */}
        {filtered.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No matching tasks found</p>
              {(searchTerm || selectedCategory !== 'All' || selectedType !== 'All' || sortBy !== 'createdAt' || sortOrder !== 'desc') && (
                <button 
                  onClick={clearFilters}
                  className="mt-2 text-amber-600 hover:text-amber-700 text-sm"
                >
                  Clear all filters
                </button>
              )}
            </div>
        ) : (
            <div className="grid gap-4 justify-items-center" 
                 style={{
                   gridTemplateColumns: isExpanded 
                     ? `repeat(auto-fit, minmax(250px, 1fr))` 
                     : `repeat(auto-fit, minmax(180px, 1fr))`
                 }}>
              {filtered.map(task => (
                  <div
                      key={task._id}
                      draggable
                      onDragStart={e => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      className="w-full max-w-sm"
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
