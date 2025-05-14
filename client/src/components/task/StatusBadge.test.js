const React = require('react');
const { render, screen } = require('@testing-library/react');
const { StatusBadge } = require('./StatusBadge');

describe('StatusBadge', () => {
  test('renders with default styles', () => {
    render(React.createElement(StatusBadge, { status: 'unknown' }));
    const badge = screen.getByText('unknown');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-gray-100');
    expect(badge.className).toContain('text-gray-800');
  });

  test('renders completed status with correct styles', () => {
    render(React.createElement(StatusBadge, { status: 'completed' }));
    const badge = screen.getByText('completed');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-green-100');
    expect(badge.className).toContain('text-green-800');
  });

  test('renders in-progress status with correct styles', () => {
    render(React.createElement(StatusBadge, { status: 'in-progress' }));
    const badge = screen.getByText('in-progress');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-blue-100');
    expect(badge.className).toContain('text-blue-800');
  });

  test('renders pending status with correct styles', () => {
    render(React.createElement(StatusBadge, { status: 'pending' }));
    const badge = screen.getByText('pending');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-yellow-100');
    expect(badge.className).toContain('text-yellow-800');
  });

  test('renders expired status with correct styles', () => {
    render(React.createElement(StatusBadge, { status: 'expired' }));
    const badge = screen.getByText('expired');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-red-100');
    expect(badge.className).toContain('text-red-800');
  });

  test('applies custom className', () => {
    const customClass = 'custom-test-class';
    render(React.createElement(StatusBadge, { status: 'completed', className: customClass }));
    const badge = screen.getByText('completed');
    expect(badge.className).toContain(customClass);
  });
}); 