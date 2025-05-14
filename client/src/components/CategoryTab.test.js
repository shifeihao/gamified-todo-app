const { render } = require('@testing-library/react');
const React = require('react');
const CategoryTab = require('./CategoryTab').default;

test('renders CategoryTab component', () => {
  render(React.createElement(CategoryTab));
});
