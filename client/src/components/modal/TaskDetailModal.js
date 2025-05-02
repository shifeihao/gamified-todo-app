import React, { useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';

export const TaskDetailModal = ({ isOpen, onClose, task }) => {
  const closeBtnRef = useRef(null);
  if (!task) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          open={isOpen}
          onClose={onClose}
          initialFocus={closeBtnRef}
          className="relative z-50"
        >
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 bg-black/30"
            aria-hidden="true"
            onClick={onClose}
          />

          {/* 居中容器 */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel
              as={motion.div}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="mx-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg"
            >
              {/* 标题部分 */}
              <div className="border-b pb-4 mb-4">
                <Dialog.Title className="text-2xl font-bold text-gray-900">
                  {task.title}
                </Dialog.Title>
                <div className="flex gap-2 mt-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {task.type}
              </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {task.category || '默认分类'}
              </span>
                </div>
              </div>

              {/* 详细信息 */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">描述</h3>
                  <p className="text-gray-600">{task.description || '暂无描述'}</p>
                </div>

                {/* 如果是长期任务，显示子任务列表 */}
                {task.type === '长期' && task.subTasks && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">子任务进度</h3>
                    <div className="space-y-2">
                      {task.subTasks.map((subTask, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <span>{subTask.title}</span>
                          <span className={`px-2 py-1 rounded ${
                            subTask.status === '已完成' ? 'bg-green-100 text-green-800' :
                              subTask.status === '进行中' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                          }`}>
                        {subTask.status}
                      </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 任务状态和进度 */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">状态信息</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-500">当前状态</p>
                      <p className="font-medium">{task.status}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-500">截止日期</p>
                      <p className="font-medium">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '无'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/*<button*/}
              {/*  ref={closeBtnRef}*/}
              {/*  onClick={onClose}*/}
              {/*  aria-label="Close"*/}
              {/*  className="mt-6 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"*/}
              {/*>*/}
              {/*  关闭*/}
              {/*</button>*/}

              {/* 操作按钮 */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  关闭
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};