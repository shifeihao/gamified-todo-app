import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';

// 卡片选择组件：可显示空白卡片数或奖励卡片列表
const CardSelector = ({
  onSelect,
  selectedCard,
  showRewards = false,   // 是否显示奖励卡片列表
  taskType = '短期'       // 任务类型，用于过滤奖励卡
}) => {
  const { user } = useContext(AuthContext);
  const [cards, setCards] = useState([]);
  const [dailyCards, setDailyCards] = useState(0);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch('/api/cards/inventory', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = await response.json();
        setCards(data.inventory);
        setDailyCards(data.dailyCards.blank || 0);
      } catch (error) {
        console.error('获取卡片失败:', error);
      }
    };
    if (user) fetchCards();
  }, [user]);

  const getCardColor = (type) => {
    switch (type) {
      case 'blank': return 'bg-gray-100';
      case 'special': return 'bg-purple-100';
      default: return 'bg-white';
    }
  };

  // 过滤奖励卡：special 且 duration 匹配或通用
  const rewardCards = cards.filter(card =>
    card.type === 'special' &&
    (card.taskDuration === taskType || card.taskDuration === '通用')
  );

  return (
    <div className="mb-4">
      <div className="text-sm font-medium mb-2">
        可用空白卡片: {dailyCards}
      </div>
      {showRewards && (
        <div className="grid grid-cols-3 gap-4">
          {rewardCards.map(card => (
            <div
              key={card._id}
              onClick={() => onSelect(card)}
              className={`p-4 rounded-lg cursor-pointer border-2 ${
                selectedCard?._id === card._id
                  ? 'border-blue-500'
                  : 'border-transparent'
              } ${getCardColor(card.type)}`}
            >
              <h3 className="font-medium">{card.title}</h3>
              {card.description && (
                <p className="text-sm text-gray-600">{card.description}</p>
              )}
              {card.type === 'special' && card.bonus && (
                <div className="mt-2 text-xs text-purple-600">
                  经验倍率: {card.bonus.experienceMultiplier}x，金币倍率: {card.bonus.goldMultiplier}x
                </div>
              )}
            </div>
          ))}
          {rewardCards.length === 0 && (
            <div className="col-span-3 text-gray-500 text-sm">
              无可用奖励卡片
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CardSelector;
