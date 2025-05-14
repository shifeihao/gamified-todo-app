const { render } = require('@testing-library/react');
const React = require('react');
const UserLevelBar = require('./UserLevelBar').default;

test('renders UserLevelBar component', () => {
  const props = {
    level: 5,
    currentExp: 500,
    requiredExp: 1000
  };
  render(React.createElement(UserLevelBar, props));
});
