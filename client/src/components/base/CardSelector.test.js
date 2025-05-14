const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
require('@testing-library/jest-dom');
const axios = require('axios');
const { CardSelector } = require('./CardSelector');
const AuthContext = require('../../context/AuthContext').default;

// 模拟axios
jest.mock('axios');

const mockCards = [
  {
    _id: '1',
    title: 'test card 1',
    description: 'This is the description of Test Card 1',
    taskDuration: 'short',
    bonus: { experienceMultiplier: 1.5, goldMultiplier: 1.2 }
  },
  {
    _id: '2',
    title: 'test card 2',
    description: 'This is the description of Test Card 2',
    taskDuration: 'long',
    bonus: { experienceMultiplier: 2, goldMultiplier: 1.8 }
  }
];

describe('CardSelectorComponent', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockCards });
  });

  test('The card selector should be rendered correctly', async () => {
    render(
      React.createElement(AuthContext.Provider, { value: { user: { token: 'test-token' } } },
        React.createElement(CardSelector, { onCardSelect: jest.fn() })
      )
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test card 1')).toBeInTheDocument();
      expect(screen.getByText('Test card 2')).toBeInTheDocument();
    });
  });

  test('Clicking the card should invoke onCardSelect', async () => {
    const mockOnCardSelect = jest.fn();
    
    render(
      React.createElement(AuthContext.Provider, { value: { user: { token: 'test-token' } } },
        React.createElement(CardSelector, { onCardSelect: mockOnCardSelect })
      )
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test card 1')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Test card 1'));
    expect(mockOnCardSelect).toHaveBeenCalledWith(mockCards[0]);
  });
});
