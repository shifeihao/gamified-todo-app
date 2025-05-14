const { render } = require('@testing-library/react');
const React = require('react');
const { Modal } = require('./Modal');

test('renders Modal component', () => {
  const props = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal'
  };
  render(
    React.createElement(Modal, props, 
      React.createElement('div', null, 'Modal content')
    )
  );
});
