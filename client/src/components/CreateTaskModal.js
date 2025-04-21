import React, { useState } from 'react';
import Modal from './Modal';
import TaskForm from './TaskForm';
import CardSelector from './CardSelector';

const CreateTaskModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading = false,
  slotIndex = -1, // -1表示从主界面创建，>=0表示从特定任务槽创建
  initialData = null
}) => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardError, setCardError] = useState('');

  const handleSubmit = async (formData) => {
    try {
      if (!selectedCard) {
        setCardError('请先选择一张卡片');
        return;
      }
      setCardError('');
      // 添加创建来源信息和卡片ID
      const taskData = {
        ...formData,
        fromSlot: slotIndex >= 0,
        slotIndex: slotIndex,
        cardId: selectedCard._id
      };
      
      await onSubmit(taskData);
      // 清除状态
      setSelectedCard(null);
      setCardError('');
      onClose(); // 提交成功后关闭模态框
    } catch (error) {
      console.error('创建任务失败:', error);
    }
  };

  // 关闭模态框时清除状态
  const handleClose = () => {
    setSelectedCard(null);
    setCardError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={slotIndex >= 0 ? `创建任务到槽位 ${slotIndex + 1}` : '创建新任务'}
    >
      <div className="py-2">
        <div className="mb-4">
          <CardSelector
            onSelect={setSelectedCard}
            selectedCard={selectedCard}
          />
          {cardError && (
            <div className="text-red-500 text-sm mt-1">{cardError}</div>
          )}
        </div>
        <TaskForm
          onSubmit={handleSubmit}
          onCancel={onClose}
          loading={loading}
        />
      </div>
    </Modal>
  );
};

export default CreateTaskModal;
