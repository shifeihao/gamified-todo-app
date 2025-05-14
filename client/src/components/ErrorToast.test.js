const { render } = require('@testing-library/react');
const React = require('react');
const ErrorToast = require('./ErrorToast').default;

test('renders ErrorToast component', () => {
  const message = 'Test error message';
  render(React.createElement(ErrorToast, { message }));
});
