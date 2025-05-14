const { render } = require('@testing-library/react');
const React = require('react');
const OverviewTab = require('./OverviewTab').default;

test('renders OverviewTab component', () => {
  render(React.createElement(OverviewTab));
});
