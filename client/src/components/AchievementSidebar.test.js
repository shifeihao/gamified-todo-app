const { render } = require('@testing-library/react');
const React = require('react');
const AchievementSidebar = require('./AchievementSidebar').default;

test('renders AchievementSidebar component', () => {
  render(React.createElement(AchievementSidebar));
});
