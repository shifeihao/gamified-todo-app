// client/src/components/task/TaskCard.js
import React, {useState, useRef, useEffect} from 'react';
import { TaskDetailModal } from "../modal";

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

  // 状态 & 类型样式
  const getStatusClass = status => {
    switch (status) {
      case 'Unfinished':
        return 'bg-yellow-100 text-yellow-800';
      case 'Ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'Finished':
        return 'bg-green-100 text-green-800';
      case 'Expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getTypeClass = type => {
    switch (type) {
      case 'Short':
        return 'bg-purple-100 text-purple-800';
      case 'Long':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const formatDate = ds => {
    if (!ds) return 'No deadline';
    const date = new Date(ds);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return task.type === 'Short'
      ? `${day}-${month}-${year} ${hours}:${minutes}`
      : `${day}-${month}-${year}`;
  };

  // 已装备卡片倒计时
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!isEquipped || !task.dueDate) return;
    const update = () => {
      const diff = new Date(task.dueDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
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

  // 装备态
  if (isEquipped) {
    if (isExpired) {
      return (
          <div
              className={`card equipped-card relative hover:shadow-lg transition-shadow duration-300
                    border-2 border-red-500 p-4 text-sm flex flex-col items-center justify-center h-40
                    ${className}`}
              draggable={false}
          >
            {/* ⚠️ 已过期大徽章 */}
            <div className="absolute top-0 right-0 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-bl">
              Expired
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
              Deleting Expired Tasks
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


        <div className="flex justify-between items-center mb-1">
          <h3 className="truncate font-semibold text-sm">{task.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(task.status)}`}>
            {task.status}
          </span>
        </div>
        <div className="flex justify-between text-gray-500 text-xs mb-2">
          {task.category && <span>Tag: {task.category}</span>}
          <span>Remaining {timeLeft}</span>
        </div>
        <div className="flex justify-between space-x-2">
          {!isExpired && (
            <button onClick={() => onComplete(task._id)} className="btn-primary text-xs py-1 px-2">
              Finish
            </button>
          )}

          <button
            onClick={handleViewDetail}
            className="text-blue-600 hover:text-blue-800"
          >
            Check the details
          </button>
          {/* 详情模态框 */}
          <TaskDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            task={task}
          />

        </div>
      </div>
    );
  }

  // 普通态
  return (
    <div
      className={`card hover:shadow-lg transition-shadow duration-300 relative ${className}`}
      draggable={draggable}
      onDragStart={onDragStart ? e => {
        if (task.status === 'Finished') {
          e.preventDefault(); // 禁止拖拽
          return;
        }
        onDragStart(e, task);
      } : undefined}

    >
      {/* 顶部：标题 + 标签 + 菜单 */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-base font-semibold leading-snug break-words">{task.title}</h3>
          <div className="flex space-x-2 mt-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(task.status)}`}>
              {task.status}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeClass(task.type)}`}>
              {task.type}
            </span>
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(o => !o)} className="p-1 text-gray-500 hover:text-gray-800">
            ⋮
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg z-10">
              {/* 仅允许未完成任务使用功能 */}
              {task.status !== 'Finished' && (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onComplete(task._id);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Finish
                  </button>
                  {onEquip && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEquip(task);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      Equipment
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(task);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Edit
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
                Delete
              </button>
            </div>
          )}

        </div>
      </div>

      {/* 分类 & 描述 */}
      {task.category && (
        <div className="text-sm text-gray-500 mb-2">Tag: {task.category}</div>
      )}
      <p className="text-sm text-gray-600 mb-4 whitespace-normal">{task.description || 'No description'}</p>

      {/* 截止 & 奖励 */}
      <div className="flex justify-between items-start text-xs text-gray-500 mb-4 space-x-2">
        <div>Expiration Date: {formatDate(task.dueDate)}</div>
        <div className="flex space-x-2">
          <div>Experiences: +{task.experienceReward}</div>
          <div>Coins: +{task.goldReward}</div>
        </div>
      </div>

      {/* 子任务 */}
      {task.subTasks?.length > 0 && (
        <div className="mt-3 border-t pt-3">
          <h4 className="text-sm font-medium mb-2">Subtask：</h4>
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
