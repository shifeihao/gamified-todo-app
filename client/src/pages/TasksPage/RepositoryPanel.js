import React from 'react';
import TaskRepository from '../../components/TaskRepository';

const RepositoryPanel = ({ tasks, onComplete, onDelete, onEdit, onEquip }) => {
    return (
        <TaskRepository
            tasks={tasks}
            onComplete={onComplete}
            onDelete={onDelete}
            onEdit={onEdit}
            onEquip={onEquip}
        />
    );
};

export default RepositoryPanel;
