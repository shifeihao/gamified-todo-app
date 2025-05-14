import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import axios from 'axios';
import { RewardCardTile } from '../task/RewardCardTile'; // 引入RewardCardTile组件

// Card selection component: can display the number of blank cards or the list of reward cards
export const CardSelector = ({
  onSelect,
  selectedCard,
  showRewards = false,   // Whether to display the reward card list
  taskType = 'short',     // Task type, used to filter reward cards
  disabled = false
}) => {
  const { user } = useContext(AuthContext);
  const [cards, setCards] = useState([]);
  const [dailyCards, setDailyCards] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setIsLoading(true);
        
        // 直接使用axios，确保获取完整数据
        const response = await axios.get('/api/cards/inventory', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        const data = response.data;
        
        // 确保数据存在再设置
        if (data && data.inventory) {
          // 存储所有卡片数据
          setCards(data.inventory || []);
        } else {
          console.warn("Card inventory data is empty");
          setCards([]);
        }
        
        // Set daily card quantity
        if (data && data.dailyCards) {
          setDailyCards(data.dailyCards.blank || 0);
        } else {
          console.warn("Daily card data is empty");
          setDailyCards(0);
        }
        
      } catch (error) {
        console.error('CardSelector - Failed to obtain card:', error);
        // Error handling: Make sure default values are set
        setCards([]);
        setDailyCards(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user && user.token) {
      fetchCards();
    }
  }, [user, taskType, showRewards]);

  const getCardColor = (type) => {
    switch (type) {
      case 'blank': return 'bg-gray-100';
      case 'special': return 'bg-purple-100 text-purple-800';
      default: return 'bg-white';
    }
  };

  const getRewardCards = () => {
    return cards.filter(card => 
      card.type === 'special' && 
      !card.used && 
      (card.taskDuration === taskType || card.taskDuration === 'general')
    );
  };
  
  const rewardCards = showRewards ? getRewardCards() : [];

  if (isLoading) {
    return <div className="mb-4">Loading cards...</div>;
  }

  return (
    <div className="mb-4" data-testid="card-selector">
      {/* The number of blank cards is only displayed when the bonus card mode is not turned on */}
      {!showRewards && (
          <div className="text-sm font-medium mb-2">
            Blank cards available: {dailyCards}
          </div>
      )}
      {showRewards && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewardCards.length > 0 ? (
            rewardCards.map(card => (
              <RewardCardTile
                key={card._id}
                card={card}
                isSelected={selectedCard?._id === card._id}
                onClick={() => onSelect(card)}
                readOnly={disabled}
              />
            ))
          ) : (
            <div className="col-span-2 text-gray-500 text-sm">
              No rewards cards available
            </div>
          )}
        </div>
      )}
    </div>
  );
};
