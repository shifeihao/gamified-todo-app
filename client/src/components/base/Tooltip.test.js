const { render } = require('@testing-library/react');
const React = require('react');
const { Tooltip } = require('./Tooltip');

test('renders Tooltip component', () => {
  const props = {
    content: 'Tooltip content'
  };
  render(
    React.createElement(Tooltip, props,
      React.createElement('button', null, 'Hover me')
    )
  );
});
