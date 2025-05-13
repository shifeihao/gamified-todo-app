module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
    '^@fullcalendar/(.*)$': '<rootDir>/node_modules/@fullcalendar/$1/index.cjs'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  testMatch: [
    '<rootDir>/client/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/client/src/**/*.{spec,test}.{js,jsx,ts,tsx}'
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  moduleDirectories: ['node_modules', 'client/src'],
  testPathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: [
    '/node_modules/(?!(@fullcalendar|lucide-react))',
    'node_modules/(?!(@fullcalendar)/)'
  ]
}; 