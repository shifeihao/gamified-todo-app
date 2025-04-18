import React from 'react';
import TaskChain from '../../components/TaskChain';

const LongtermTaskPanel = ({ tasks, onComplete, onDelete, onEdit }) => {
    return (
        <TaskChain
            tasks={tasks}
            onComplete={onComplete}
            onDelete={onDelete}
            onEdit={onEdit}
        />
    );
};

export default LongtermTaskPanel;
