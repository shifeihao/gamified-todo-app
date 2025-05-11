import React, { useState, useRef, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';

export const TaskDetailModal = ({ isOpen, onClose, task }) => {
  const closeBtnRef = useRef(null);
  const [subTasks, setSubTasks] = useState([]);
  const [loadingIdx, setLoadingIdx] = useState(null);

  // 计算任务 ID，兼容 _id 或 id
  const taskId = task?._id || task?.id;

  // 同步外部 task.subTasks 到本地 state
  useEffect(() => {
    if (task?.subTasks) setSubTasks(task.subTasks);
  }, [task]);

  if (!task) return null;

  // 格式化日期
  const formatDate = (iso) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  // 完成子任务，通过主任务路由提交子任务更新
  const handleComplete = async (subTask, idx) => {
    const raw = localStorage.getItem('userInfo');
    const userInfo = raw ? JSON.parse(raw) : {};
    const token = userInfo.token;
    const subTaskId = subTask._id || subTask.id;

    if (!token) {
      alert('No login information detected, please log in first');
      return;
    }

    setLoadingIdx(idx);
    try {
      // 使用 PUT 主任务路由，同时传 subTaskId 和 status
      const res = await axios.put(
          `/api/tasks/${taskId}`,
          { subTaskId, status: '已完成' },
          { headers: { Authorization: `Bearer ${token}` } }
      );

      // 返回更新后的子任务对象
      const updatedSub = res.data;
      setSubTasks(prev =>
          prev.map((st, i) =>
              i === idx ? { ...st, status: updatedSub.status } : st
          )
      );
      
      // 触发等级更新事件
      window.dispatchEvent(new CustomEvent('taskCompleted'));
    } catch (err) {
      console.error('Update subtask failed', err);
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;
      if (status === 401) {
        alert('Authorization has expired, please log in again');
        window.location.href = '/login';
      } else if (status === 404) {
        alert('子任务未找到或已被删除');
      } else {
        alert(`Update subtask failed (status code ${status})：${msg}`);
      }
    } finally {
      setLoadingIdx(null);
    }
  };

  return (
      <AnimatePresence>
        {isOpen && (
            <Dialog
                open={isOpen}
                onClose={onClose}
                initialFocus={closeBtnRef}
                className="relative z-50"
            >
              <div className="fixed inset-0 bg-black/30" aria-hidden="true" onClick={onClose} />
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel
                    as={motion.div}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="mx-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg"
                >
                  <div className="border-b pb-4 mb-4">
                    <Dialog.Title className="text-2xl font-bold">{task.title}</Dialog.Title>
                    <div className="flex gap-2 mt-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {task.type}
                  </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    {task.category || '默认分类'}
                  </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Describe</h3>
                      <p className="text-gray-600">
                        {task.description || 'Currently no description available'}
                      </p>
                    </div>

                    {task.type === '长期' && subTasks.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Subtask Process</h3>
                          <div className="space-y-2">
                            {subTasks.map((subTask, idx) => (
                                <div
                                    key={subTask._id || subTask.id || idx}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                >
                                  <span className="flex-1">{subTask.title}</span>
                                  <span className="w-24 text-center">
                            {formatDate(subTask.dueDate)}
                          </span>
                                  <span
                                      className={`px-2 py-1 rounded ${
                                          subTask.status === '已完成'
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-yellow-100 text-yellow-800'
                                      }`}
                                  >
                            {subTask.status}
                          </span>
                                  {subTask.status !== '已完成' && (
                                      <button
                                          onClick={() => handleComplete(subTask, idx)}
                                          disabled={loadingIdx === idx}
                                          className={`ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 ${
                                              loadingIdx === idx ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                                      >
                                        {loadingIdx === idx ? 'Submitting...' : 'Complete'}
                                      </button>
                                  )}
                                </div>
                            ))}
                          </div>
                        </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Status Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm text-gray-500">Current Status</p>
                          <p className="font-medium">{task.status}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm text-gray-500">Expiration Date</p>
                          <p className="font-medium">
                            {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString()
                                : '无'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                        ref={closeBtnRef}
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </div>
            </Dialog>
        )}
      </AnimatePresence>
  );
};
