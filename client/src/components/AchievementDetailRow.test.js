import { render } from '@testing-library/react';
import AchievementDetailRow from './AchievementDetailRow';

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
  render(<AchievementDetailRow achievement={mockAchievement} userStats={mockUserStats} />);
});
