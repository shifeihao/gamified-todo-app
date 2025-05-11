// client/src/components/task/TaskCard.js
import React, {useState, useRef, useEffect} from 'react';
import { TaskDetailModal } from "../modal";
import { CheckSquare, Square, Clock, Calendar, Award, Edit2, Trash2, Info } from 'lucide-react';

// 任务卡片组件
export const TaskCard = ({
                           task,
                           onComplete,
                           onDelete,
                           onEdit,
                           onEquip,
                           onUnequip,
                           onViewDetail,
                           draggable = false,
                           onDragStart,
                           isEquipped = false,
                           className = ''
                         }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();
  // 短期任务超时标记
  const isExpired = isEquipped && task.expired === true;
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleViewDetail = () => {
    setIsDetailModalOpen(true);
  };


  // 点击空白关闭菜单
  useEffect(() => {
    const handleClickOutside = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 已装备卡片倒计时
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!isEquipped || !task.dueDate) return;
    const update = () => {
      const diff = new Date(task.dueDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('已过期');
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${d}d${h}h${m}m`);
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [task.dueDate, isEquipped]);

  // 计算任务进度
  const calculateProgress = () => {
    if (!task.subTasks || task.subTasks.length === 0) return 0;
    const completed = task.subTasks.filter(st => st.status === '已完成').length;
    return Math.round((completed / task.subTasks.length) * 100);
  };

  // 获取任务类型对应的颜色和图标
  const getTypeStyles = () => {
    switch (task.category) {
      case '编程':
        return {
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-300',
          textColor: 'text-blue-800',
          icon: '💻'
        };
      case '学习':
        return {
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300',
          textColor: 'text-green-800',
          icon: '📚'
        };
      case '工作':
        return {
          bgColor: 'bg-purple-100',
          borderColor: 'border-purple-300',
          textColor: 'text-purple-800',
          icon: '💼'
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-300',
          textColor: 'text-gray-800',
          icon: '📝'
        };
    }
  };

  const typeStyles = getTypeStyles();
  const progress = calculateProgress();

  // 获取状态样式
  const getStatusStyles = () => {
    switch (task.status) {
      case '已完成':
        return 'bg-green-100 text-green-800 border-green-200';
      case '进行中':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case '待完成':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case '过期':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // 装备态卡片
  if (isEquipped) {
    return (
      <div
              className={`card equipped-card relative hover:shadow-lg transition-shadow duration-300
                    border-2 border-red-500 p-4 text-sm flex flex-col items-center justify-center h-40
                    ${className}`}
              draggable={false}
          >
            {/* ⚠️ 已过期大徽章 */}
            <div className="absolute top-0 right-0 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-bl">
              已过期
            </div>

            {/* 任务标题 */}
            <h3 className="font-bold text-base text-center mb-4 truncate">
              {task.title}
            </h3>

            {/* 删除按钮 */}
            <button
                onClick={() => onDelete(task._id)}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow"
            >
              删除过期任务
            </button>
          </div>
      );
    }
    return (
      <div
        className={`card equipped-card hover:shadow-lg transition-shadow duration-300
                    border-2 border-blue-500 p-2 text-xs flex flex-col justify-between h-full
                    ${className}`}
        draggable={draggable}
        onDragStart={onDragStart ? e => onDragStart(e, task) : undefined}
      >
        {/* 左侧类型标识 */}
        <div className={`w-1/6 ${typeStyles.bgColor} bg-opacity-50 flex items-center justify-center`}>
          <span className={`font-medium ${typeStyles.textColor} px-2 py-1 rounded-md text-xs`}>
            {typeStyles.icon} {task.category || '任务'}
          </span>
        </div>
        <div className="flex justify-between text-gray-500 text-xs mb-2">
          {task.category && <span>分类: {task.category}</span>}
          <span>剩余 {timeLeft}</span>
          </div>
        <div className="flex justify-between space-x-2">
          {!isExpired && (
            <button onClick={() => onComplete(task._id)} className="btn-primary text-xs py-1 px-2">
              完成
            </button>
          )}

          <button
            onClick={handleViewDetail}
            className="text-blue-600 hover:text-blue-800"
          >
            查看详情
          </button>
            {!isExpired && task.status !== '已完成' && (
              <button
                onClick={() => onComplete(task._id)}
                className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors"
                title="完成任务"
              >
            View Details
                <CheckSquare className="w-4 h-4" />
              </button>
            )}
          </div>

        {/* 详情模态框 */}
        <TaskDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          task={task}
        />
      </div>
    );
  }

  // 普通态卡片（仓库中）
  return (
    <div
      className={`flex rounded-lg overflow-hidden backdrop-blur-sm bg-white bg-opacity-40 border ${typeStyles.borderColor} shadow-lg transition-all duration-300 ${className}`}
      draggable={draggable && task.status !== '已完成'}
      onDragStart={onDragStart ? e => onDragStart(e, task) : undefined}
    >
      {/* 左侧类型标识 */}
      <div className={`w-1/6 ${typeStyles.bgColor} bg-opacity-50 flex items-center justify-center`}>
        <span className={`font-medium ${typeStyles.textColor} px-2 py-1 rounded-md text-xs`}>
          {typeStyles.icon} {task.category || '任务'}
        </span>
      </div>

      {/* 右侧内容 */}
      <div className="w-5/6 p-4 relative">
        {/* 状态标签 */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles()}`}>
          {task.status}
        </div>

        {/* 标题和描述 */}
        <div className="mb-4">
          <h3 className="font-bold text-gray-900 mb-1">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
          )}
        </div>

        {/* 子任务进度 */}
        {task.subTasks && task.subTasks.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600">任务进度</span>
              <span className="text-xs font-medium text-gray-700">{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 底部信息和操作 */}
        <div className="flex justify-between items-center mt-2">
          {/* 截止日期 */}
          <div className="flex items-center text-xs text-gray-600">
            <Calendar className="w-3 h-3 mr-1" />
            {task.dueDate ? new Date(task.dueDate).toLocaleDateString('zh-CN') : '无截止日期'}
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-2">
            <button
              onClick={handleViewDetail}
              className="p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors"
              title="查看详情"
            >
              <Info className="w-4 h-4" />
            </button>
            {task.status !== '已完成' && (
              <>
                <button
                  onClick={() => onEquip(task)}
                  className="p-1 rounded hover:bg-purple-100 text-purple-600 transition-colors"
                  title="装备任务"
                >
                    Complete
                  <Award className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(task)}
                  className="p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                  title="编辑任务"
                >
                      Equip
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={() => onDelete(task._id)}
              className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
              title="删除任务"
            >
                    编辑
                  </button>
                </>
              )}

              {/* 删除按钮始终允许 */}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(task._id);
                }}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              >
                删除
            </button>
          </div>
        </div>
      </div>

      {/* 分类 & 描述 */}
      {task.category && (
        <div className="text-sm text-gray-500 mb-2">分类: {task.category}</div>
      )}
      <p className="text-sm text-gray-600 mb-4 whitespace-normal">{task.description || '无描述'}</p>

      {/* 截止 & 奖励 */}
      <div className="flex justify-between items-start text-xs text-gray-500 mb-4 space-x-2">
        <div>截止日期: {formatDate(task.dueDate)}</div>
        <div className="flex space-x-2">
          <div>经验值: +{task.experienceReward}</div>
          <div>金币: +{task.goldReward}</div>
        </div>
      </div>

      {/* 子任务 */}
      {task.subTasks?.length > 0 && (
        <div className="mt-3 border-t pt-3">
          <h4 className="text-sm font-medium mb-2">子任务：</h4>
          <ul className="text-sm space-y-1">
            {task.subTasks.map((st, i) => (
              <li key={i} className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${getStatusClass(st.status)}`}></span>
                <span className="break-words">{st.title}</span>
                {st.dueDate && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({formatDate(st.dueDate)})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
