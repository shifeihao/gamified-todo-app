# TaskMaster Backend Testing Guide

## Overview

The TaskMaster project uses the following testing frameworks and tools:

- **Jest**: Main testing framework
- **SuperTest**: For API integration testing
- **MongoDB Memory Server**: In-memory database for test environment

## Test Types

The project includes two main types of tests:

1. **Unit Tests**: Testing individual controller methods
2. **Integration Tests**: Testing complete API endpoints including request handling and database interactions

## Directory Structure

```
server/__tests__/
├── setup.js                    # Test environment setup
├── integration/                # Integration tests
│   ├── user.test.js            # User API tests
│   └── dungeon.test.js         # Dungeon API tests
└── unit/                       # Unit tests
    └── controllers/            # Controller tests
        ├── achievementController.test.js  # Achievement tests
        ├── cardController.test.js         # Card tests
        ├── characterController.test.js    # Character tests
        ├── dungeonController.test.js      # Dungeon tests
        ├── inventoryController.test.js    # Inventory tests
        ├── levelController.test.js        # Level tests
        ├── shopController.test.js         # Shop tests
        ├── taskController.test.js         # Task tests
        ├── taskTemplateController.test.js # Task template tests
        └── userController.test.js         # User tests
```

## Running Tests

You can run tests using the following commands:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

## Core Features Covered

### 1. User System
- User registration
- User login
- User profile management
- User information updates

### 2. Task System
- Task creation
- Task listing
- Task status updates
- Task deletion

### 3. Card System
- Card inventory management
- Daily/weekly card distribution
- Card usage

### 4. Achievement System
- Achievement unlock mechanism
- Achievement checking
- Achievement rewards

### 5. Dungeon Exploration System
- Dungeon entry
- Floor exploration
- Combat system
- Exploration summarization

### 6. Character System
- Class selection
- Character stats
- Stat point allocation

### 7. Shop and Inventory System
- Shop item listing
- Item purchase and sale
- Equipment management
- Consumable item usage

### 8. Template System
- Task template creation
- Template application
- Template sharing

## Writing New Tests

### Unit Test Example

```javascript
// Import controller function to test
import { getTaskById } from '../../../controllers/taskController.js';

// Mock request and response
const req = {
  user: { _id: 'user-id' },
  params: { id: 'task-id' }
};
const res = mockResponse();

// Test function
it('should retrieve the specified task', async () => {
  await getTaskById(req, res);
  expect(res.json).toHaveBeenCalled();
});
```

### Integration Test Example

```javascript
it('should retrieve user task list', async () => {
  const res = await request(app)
    .get('/api/tasks')
    .set('Authorization', `Bearer ${authToken}`);
    
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});
```

## Continuous Integration

The project is configured with GitHub Actions for continuous integration testing. Tests run automatically on every push to main branches or when creating Pull Requests.

Configuration file: `.github/workflows/test.yml`

## Best Practices

1. **Independent Tests**: Each test should run independently, not relying on the state of other tests
2. **Mock External Dependencies**: Use Jest's mocking capabilities for external services
3. **Clean Test Data**: Clean up test data after each test
4. **Clear Naming**: Test names should clearly describe what is being tested

## Troubleshooting

### Test Timeouts
The default test timeout may not be sufficient for some operations. You can increase the timeout in tests:

```javascript
it('test with longer operation', async () => {
  // Set timeout to 10 seconds
}, 10000);
```

### Database Connection Issues
Ensure the test environment is properly set up. Check database connection configuration in `setup.js`.

### Asynchronous Issues
Ensure proper handling of asynchronous tests using `async/await` or `done` callback. 