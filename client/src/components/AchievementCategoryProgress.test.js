const { render } = require('@testing-library/react');
const React = require('react');
const AchievementCategoryProgress = require('./achievement/AchievementCategoryProgress').default;

test('should render AchievementCategoryProgress component', () => {
  render(React.createElement(AchievementCategoryProgress));
});
