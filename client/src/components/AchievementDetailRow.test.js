const { render } = require('@testing-library/react');
const React = require('react');
const AchievementDetailRow = require('./achievement/AchievementDetailRow').default;

const mockAchievement = {
  unlocked: false,
  icon: 'default_icon_unlocked.png',
  logic: { type: 'test', value: 10 },
  name: 'Test Achievement',
  description: 'This is a test achievement',
  condition: 'Test condition',
  unlockedAt: new Date().toISOString(),
};

const mockUserStats = {
  test: 5,
};

test('should render AchievementDetailRow component', () => {
  render(React.createElement(AchievementDetailRow, { 
    achievement: mockAchievement, 
    userStats: mockUserStats 
  }));
});
