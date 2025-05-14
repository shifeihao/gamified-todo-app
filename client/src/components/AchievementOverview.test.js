const { render } = require('@testing-library/react');
const React = require('react');
const AchievementOverview = require('./AchievementOverview').default;

test('renders AchievementOverview component', () => {
  render(React.createElement(AchievementOverview));
});
