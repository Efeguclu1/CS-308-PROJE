# Unit Tests for E-Commerce Backend

This directory contains unit tests for the e-commerce application backend. These tests verify the functionality of various components without modifying any existing code.

## Test Coverage

The unit tests cover the following areas:
- Authentication (user registration, login, admin accounts)
- Product management (CRUD operations)
- Order processing (creation, retrieval, status updates)
- Payment handling (processing, validation, refunds)
- Utility functions (email services, invoice generation)

## Running the Tests

To run the tests, follow these steps:

1. Make sure you have all the dependencies installed:
   ```
   npm install
   ```

2. Install the test-specific dependencies:
   ```
   npm install --save-dev mocha sinon
   ```

3. Run the tests:
   ```
   npm test
   ```

## Test Structure

The tests use Mocha as the test framework and Sinon for mocking. Each test follows this structure:
- **Arrange**: Set up the test data and environment
- **Act**: Execute the functionality being tested (mock implementation)
- **Assert**: Verify the expected outcomes
- **Clean up**: Restore any mocked functionality

## Important Notes

1. These tests are designed to be non-invasive and will not:
   - Modify any existing code in the backend
   - Make actual database calls
   - Send real emails
   - Process actual payments

2. The tests use mocking to simulate external dependencies, including:
   - Database connections
   - Email services
   - PDF generation
   - Authentication services

3. To connect these tests to the actual implementation, you would need to:
   - Import the actual route handlers
   - Set up proper test databases if needed
   - Configure environment variables for testing

## Extending the Tests

To add more tests:
1. Follow the existing pattern in `unit-tests.js`
2. Use the `mockReq` and `mockRes` helpers for simulating Express requests/responses
3. Use Sinon for mocking external dependencies

These tests provide a starting point for more comprehensive test coverage of the application. 