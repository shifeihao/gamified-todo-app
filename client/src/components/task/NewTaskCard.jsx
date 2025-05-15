import React, { useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';

export const NewTaskCard = () => {
  const [subtasks, setSubtasks] = useState([
    { id: 1, text: 'Learn Java Fundamentals', completed: true },
    { id: 2, text: 'Complete Object-Oriented Programming Exercises', completed: false },
    { id: 3, text: 'Build a Simple Java Application', completed: false },
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
            Coding Course
          </span>
        </div>
        
        {/* 右侧内容 - 占比5 */}
        <div className="w-5/6 p-4 flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Learn Java</h3>
              <p className="text-gray-600 text-sm mt-1">
                Learn the Java programming language to build software, web, and mobile applications
              </p>
            </div>
            <div className="bg-gray-100 px-3 py-1 rounded text-sm font-medium text-gray-700">
              In Progress
            </div>
          </div>
          
          <div className="mt-2">
            <h4 className="font-medium text-gray-700 mb-2">Subtask</h4>
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
              <span className="text-xs text-gray-500">Expired Date</span>
              <span className="text-xs font-medium text-gray-700">May 20th</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-600">Beginner-Friendly</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-xs text-gray-600">17 hour</span>
            </div>
          </div>
        </div>
      </div>

      {/* 额外卡片示例 */}
      <div className="flex rounded-lg shadow-md overflow-hidden bg-white border border-gray-100">
        <div className="bg-blue-100 w-1/6 flex items-center justify-center">
          <span className="font-medium text-blue-800 px-2 py-1 bg-blue-200 rounded-md text-xs">
            Project Task
          </span>
        </div>
        <div className="w-5/6 p-4 flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Build a Java Calculator</h3>
              <p className="text-gray-600 text-sm mt-1">
                Create a graphical calculator with basic arithmetic functions using Java Swing.
              </p>
            </div>
            <div className="bg-yellow-100 px-3 py-1 rounded text-sm font-medium text-yellow-700">
              Not Started
            </div>
          </div>
          
          <div className="mt-2">
            <h4 className="font-medium text-gray-700 mb-2">Subquest</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 cursor-pointer">
                <Square className="text-gray-400 w-5 h-5" />
                <span className="text-sm text-gray-700">Design the UI Interface</span>
              </div>
              <div className="flex items-center gap-2 cursor-pointer">
                <Square className="text-gray-400 w-5 h-5" />
                <span className="text-sm text-gray-700">Implement Basic Arithmetic Functions</span>
              </div>
              <div className="flex items-center gap-2 cursor-pointer">
                <Square className="text-gray-400 w-5 h-5" />
                <span className="text-sm text-gray-700">Add Error Handling Mechanisms</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Expired Date</span>
              <span className="text-xs font-medium text-gray-700">June 5th</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span className="text-xs text-gray-600">Intermediate Difficulty</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-xs text-gray-600">8 hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};