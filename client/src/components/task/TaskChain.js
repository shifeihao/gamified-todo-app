import React, { useMemo } from 'react';
import { TaskCard } from './TaskCard';
import { Plus, Lock, ArrowRight, ArrowDown } from 'lucide-react';

export const TaskChain = ({
                       tasks,
                       onComplete,
                       onDelete,
                       onEdit,
                       onCreateTask,
                       onDrop,
                   }) => {
    const totalSlots = 5;
    const activeCount = 2;

    // ✅ Use useMemo to calculate slot contents to avoid infinite loops
    const slots = useMemo(() => {
        const longTermTasks = tasks.filter(task => task.type === 'long');
        const result = Array(totalSlots).fill(null);
        longTermTasks.forEach((task, idx) => {
            if (idx < activeCount) result[idx] = task;
        });
        return result;
    }, [tasks]);

    const handleDragOver = (e, idx) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-purple-50', 'border-purple-300', 'ring-2', 'ring-purple-200');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('bg-purple-50', 'border-purple-300', 'ring-2', 'ring-purple-200');
    };

    const handleDropItem = (e, idx) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-purple-50', 'border-purple-300', 'ring-2', 'ring-purple-200');
        try {
            const data = JSON.parse(e.dataTransfer.getData('task'));
            if (data && onDrop) onDrop(data._id, idx);
        } catch (err) {
            console.error('Dragging the long-term task failed:', err);
        }
    };

    const renderSlot = (task, idx) => (
        <div
            key={idx}
            className="border border-dashed border-purple-200 rounded-xl min-h-[10rem] overflow-visible relative
                       bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300"
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDropItem(e, idx)}
        >
            {task ? (
                <TaskCard
                    className="w-full h-full"
                    task={task}
                    onComplete={onComplete}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    isEquipped
                />
            ) : (
                <button
                    onClick={() => onCreateTask && onCreateTask(idx)}
                    className="group absolute inset-0 w-full h-full flex flex-col items-center justify-center 
                              text-purple-500 transition-all"
                >
                    <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5" />
                    </div>
                    <p className="text-sm text-purple-500 group-hover:text-purple-600">Create Quest Chain</p>
                    <p className="text-xs text-gray-400 mt-1">Chain Slot {idx + 1}</p>
                </button>
            )}
            
            {/* Add slot number indicator */}
            {task && (
                <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center shadow-sm">
                    {idx + 1}
                </div>
            )}
        </div>
    );

    const renderLocked = (idx) => (
        <div
            key={idx}
            className="border border-gray-200 rounded-xl min-h-[10rem] bg-gray-50
                     flex flex-col items-center justify-center
                     shadow-sm"
        >
            <div className="flex flex-col items-center justify-center gap-2">
                <div className="bg-gray-100 rounded-full p-2.5 border border-gray-200">
                    <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-500">Chain Slot Locked</p>
                </div>
            </div>
        </div>
    );

    // Connecting lines between rendering task chains
    const renderTaskConnector = (idx) => {
        if (idx >= activeCount - 1 || !slots[idx] || !slots[idx+1]) return null;
        
        return (
            <div className="flex justify-center -mt-1 -mb-1 h-8">
                <div className="w-1 h-full bg-purple-200 relative">
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-purple-400">
                        <ArrowDown className="h-4 w-4" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col">
            {slots.map((task, idx) => (
                <React.Fragment key={`chain-${idx}`}>
                    {idx < activeCount ? renderSlot(task, idx) : renderLocked(idx)}
                    {idx < totalSlots - 1 && renderTaskConnector(idx)}
                </React.Fragment>
            ))}
        </div>
    );
};
