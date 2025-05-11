import React, { useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';

export const NewTaskCard = () => {
  const [subtasks, setSubtasks] = useState([
    { id: 1, text: '学习Java基础语法', completed: true },
    { id: 2, text: '完成面向对象编程练习', completed: false },
    { id: 3, text: '构建一个简单的Java应用', completed: false },
  ]);

  const toggleSubtask = (id) => {
    setSubtasks(subtasks.map(task => 
      task.id === id ? {...task, completed: !task.completed} : task
    ));
  };

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto p-6">
      {/* 主卡片 */}
      <div className="flex rounded-lg shadow-md overflow-hidden bg-white border border-gray-100">
        {/* 左侧颜色条 - 占比1 */}
        <div className="bg-green-100 w-1/6 flex items-center justify-center">
          <span className="font-medium text-green-800 px-2 py-1 bg-green-200 rounded-md text-xs">
            编程课程
          </span>
        </div>
        
        {/* 右侧内容 - 占比5 */}
        <div className="w-5/6 p-4 flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Learn Java</h3>
              <p className="text-gray-600 text-sm mt-1">
                学习Java编程语言，用于创建软件、Web和移动应用程序
              </p>
            </div>
            <div className="bg-gray-100 px-3 py-1 rounded text-sm font-medium text-gray-700">
              进行中
            </div>
          </div>
          
          <div className="mt-2">
            <h4 className="font-medium text-gray-700 mb-2">子任务</h4>
            <div className="space-y-2">
              {subtasks.map(task => (
                <div 
                  key={task.id} 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => toggleSubtask(task.id)}
                >
                  {task.completed ? 
                    <CheckSquare className="text-blue-600 w-5 h-5" /> :
                    <Square className="text-gray-400 w-5 h-5" />
                  }
                  <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                    {task.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">截止日期</span>
              <span className="text-xs font-medium text-gray-700">5月20日</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-600">初学者友好</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-xs text-gray-600">17小时</span>
            </div>
          </div>
        </div>
      </div>

      {/* 额外卡片示例 */}
      <div className="flex rounded-lg shadow-md overflow-hidden bg-white border border-gray-100">
        <div className="bg-blue-100 w-1/6 flex items-center justify-center">
          <span className="font-medium text-blue-800 px-2 py-1 bg-blue-200 rounded-md text-xs">
            项目任务
          </span>
        </div>
        <div className="w-5/6 p-4 flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-800">构建Java计算器</h3>
              <p className="text-gray-600 text-sm mt-1">
                使用Java Swing创建一个具有基本算术功能的图形界面计算器
              </p>
            </div>
            <div className="bg-yellow-100 px-3 py-1 rounded text-sm font-medium text-yellow-700">
              待开始
            </div>
          </div>
          
          <div className="mt-2">
            <h4 className="font-medium text-gray-700 mb-2">子任务</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 cursor-pointer">
                <Square className="text-gray-400 w-5 h-5" />
                <span className="text-sm text-gray-700">设计UI界面</span>
              </div>
              <div className="flex items-center gap-2 cursor-pointer">
                <Square className="text-gray-400 w-5 h-5" />
                <span className="text-sm text-gray-700">实现基本运算功能</span>
              </div>
              <div className="flex items-center gap-2 cursor-pointer">
                <Square className="text-gray-400 w-5 h-5" />
                <span className="text-sm text-gray-700">添加错误处理机制</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">截止日期</span>
              <span className="text-xs font-medium text-gray-700">6月5日</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span className="text-xs text-gray-600">中级难度</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-xs text-gray-600">8小时</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};