# Testing Guide - Earthquake Safety Agent

Comprehensive testing suite for the Earthquake Safety Agent project, including unit tests for the MCP server, AI agent, and frontend.

## 📊 Test Overview

```
╔══════════════════════════════════════════════╗
║         TEST SUITE SUMMARY                   ║
╚══════════════════════════════════════════════╝

✅ MCP Server Tests:    8 tests  (Jest/TypeScript)
✅ Agent Tests:          7 tests  (pytest/Python)
✅ Frontend Tests:      21 tests  (Vitest/TypeScript)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Total:               36 tests  (100% passing)
```

## 🚀 Quick Start

### Run All Tests (One Command)

```bash
cd tests
npm test
```

This single command will:
1. Run MCP server tests (Jest)
2. Run agent tests (pytest)
3. Run frontend tests (Vitest)
4. Display results for all 36 tests

**Execution Time:** ~3-4 seconds

## 📦 First Time Setup

### Option 1: Automated Setup (Recommended)

```bash
cd tests
./setup.sh
```

The setup script will:
- Install Node.js test dependencies
- Install Python test dependencies
- Configure test environments

### Option 2: Manual Setup

```bash
# 1. Install Node.js dependencies for MCP server tests
cd tests
npm install

# 2. Install Python dependencies for agent tests
cd ..
source agent/venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r tests/requirements.txt

# 3. Install frontend test dependencies
cd tests/frontend
npm install
```

## 🧪 Running Individual Test Suites

### MCP Server Tests

```bash
cd tests
npm run test:mcp
```

**Tests:** 8 tests using Jest  
**Coverage:**
- Configuration loading and validation
- Earthquake cache operations
- Cache key generation and normalization
- Cache statistics tracking
- TTL calculation for data freshness

### Agent Tests

```bash
cd tests
npm run test:agent
```

**Tests:** 7 tests using pytest  
**Coverage:**
- Helper function validation (`get_current_datetime`)
- MCPToolset initialization
- Agent configuration (name, model, tools)
- Instruction content validation
- Tool setup verification

### Frontend Tests

```bash
cd tests
npm run test:frontend
```

**Tests:** 21 tests using Vitest  
**Coverage:**
- **Storage Service** (11 tests):
  - Session management (create, save, load, clear)
  - ID generation and uniqueness
  - Message handling
  - Data immutability
  - Timestamp updates

- **API Service** (10 tests):
  - Session creation
  - Message sending/receiving
  - Response parsing
  - Error handling (network, API, timeout)
  - Health check functionality

## 📋 Test Details

### MCP Server Tests (`test_mcp_server.test.ts`)

**Framework:** Jest with ts-jest  
**Environment:** Node.js  
**Location:** `tests/test_mcp_server.test.ts`

**What's Tested:**
1. ✓ Configuration loads with default values
2. ✓ Cache generates consistent keys for same parameters
3. ✓ Cache generates different keys for different parameters
4. ✓ Cache stores and retrieves data correctly
5. ✓ Cache tracks statistics (hits, misses, hit rate)
6. ✓ Cache clears all entries
7. ✓ Cache deletes specific entries
8. ✓ Cache calculates appropriate TTL

### Agent Tests (`test_agent.py`)

**Framework:** pytest  
**Environment:** Python 3.12+  
**Location:** `tests/test_agent.py`

**What's Tested:**
1. ✓ `get_current_datetime()` returns valid ISO 8601 format
2. ✓ `get_current_datetime()` returns current time
3. ✓ `mcp_streamable_http_tool()` returns MCPToolset
4. ✓ INSTRUCTION constant is defined and contains key sections
5. ✓ Agent has proper configuration (name, model)
6. ✓ Agent has required tools configured

### Frontend Tests (`frontend/`)

**Framework:** Vitest  
**Environment:** jsdom (browser simulation)  
**Location:** `tests/frontend/`

#### Storage Tests (`storage.test.ts` - 11 tests)
1. ✓ Generates unique IDs
2. ✓ Generates IDs in correct format
3. ✓ Creates new session with correct structure
4. ✓ Saves and loads sessions correctly
5. ✓ Returns null when no session exists
6. ✓ Saves sessions with messages
7. ✓ Clears session from storage
8. ✓ Adds message to session
9. ✓ Preserves existing messages when adding new one
10. ✓ Updates timestamp when adding message
11. ✓ Does not mutate original session

#### API Tests (`api.test.ts` - 10 tests)
1. ✓ Creates session successfully
2. ✓ Throws error on session creation failure
3. ✓ Sends message and returns response
4. ✓ Handles API error responses
5. ✓ Handles network errors
6. ✓ Throws error when no response received
7. ✓ Extracts sessionId from response
8. ✓ Health check returns true when healthy
9. ✓ Health check returns false when unhealthy
10. ✓ Health check returns false on network error

## 🔧 Advanced Testing Options

### Watch Mode (Frontend Tests)

Automatically re-run tests when files change:

```bash
cd tests/frontend
npm run test:watch
```

### Coverage Reports

Generate coverage reports for frontend tests:

```bash
cd tests/frontend
npm run test:coverage
```

### Verbose Output

For more detailed test output:

```bash
# MCP Server (already verbose)
cd tests
npm run test:mcp

# Agent (verbose mode)
cd tests
npm run test:agent  # pytest already runs in verbose mode (-v flag)

# Frontend (verbose mode)
cd tests/frontend
npm test -- --reporter=verbose
```

## 🐛 Debugging Tests

### Common Issues and Solutions

#### 1. "Cannot find module" errors

**Solution:** Ensure dependencies are installed:
```bash
cd tests
npm install
cd frontend && npm install
```

#### 2. Python import errors

**Solution:** Activate virtual environment and install dependencies:
```bash
source ../agent/venv/bin/activate
pip install -r requirements.txt
```

#### 3. localStorage is not defined

**Solution:** This is already handled in the test setup. If you see this error, ensure `vitest.setup.ts` is being loaded.

#### 4. Tests pass but show stderr messages

**This is normal!** Error messages in stderr are from tests that intentionally trigger errors to verify error handling works correctly. As long as tests show as "passed", everything is working.

## 📁 Test File Structure

```
tests/
├── test_mcp_server.test.ts  # MCP server tests (Jest)
├── test_agent.py             # Agent tests (pytest)
├── frontend/                 # Frontend tests (Vitest)
│   ├── storage.test.ts       # Storage service tests
│   ├── api.test.ts           # API service tests
│   ├── vitest.config.ts      # Vitest configuration
│   ├── vitest.setup.ts       # Test setup and mocks
│   ├── package.json          # Frontend test dependencies
│   └── README.md             # Frontend test documentation
├── package.json              # Main test configuration
├── jest.config.js            # Jest configuration
├── tsconfig.json             # TypeScript configuration
├── requirements.txt          # Python test dependencies
├── setup.sh                  # Automated setup script
└── README.md                 # This file
```

## 🔍 Understanding Test Output

### Successful Test Run

```bash
$ npm test

> earthquake-tests@1.0.0 test
> npm run test:mcp && npm run test:agent && npm run test:frontend

# MCP Server Tests
Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total

# Agent Tests
collected 7 items
7 passed, 2 warnings in 2.44s

# Frontend Tests
Test Files  2 passed (2)
Tests      21 passed (21)
```

### What stderr Messages Mean

You may see error messages in the output like:
- "Session creation failed: Error: Network error"
- "Error sending message: API request failed"

**This is completely normal!** These are from tests that intentionally trigger errors to verify your error handling code works correctly. As long as the tests show as "passed", everything is fine.

## 📊 Test Statistics

- **Total Tests:** 36
- **Pass Rate:** 100%
- **Execution Time:** ~3-4 seconds
- **Setup Time:** < 2 minutes (first time only)
- **Dependencies:** 
  - Node.js: jest, ts-jest, vitest
  - Python: pytest, pytest-cov

## ✨ Features

- ✅ Simple one-command execution
- ✅ Comprehensive coverage (36 tests)
- ✅ Fast execution (~3-4 seconds)
- ✅ Proper mocking (fetch, localStorage)
- ✅ Isolated to `/tests` directory
- ✅ No changes to production code
- ✅ Easy to extend with more tests

## 🎯 Best Practices

### Before Committing Code

Always run tests before committing:

```bash
cd tests
npm test
```

### Adding New Tests

1. **For MCP Server:** Add tests to `test_mcp_server.test.ts`
2. **For Agent:** Add tests to `test_agent.py`
3. **For Frontend:** Add tests to `frontend/storage.test.ts` or `frontend/api.test.ts`

### Test Naming Conventions

- MCP Server: `should [expected behavior]`
- Agent: `test_[function]_[expected_behavior]`
- Frontend: `should [expected behavior]`

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [pytest Documentation](https://docs.pytest.org/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)

## 🤝 Contributing Tests

When contributing new features:

1. Write tests for your new code
2. Ensure all existing tests still pass
3. Update this README if adding new test categories
4. Follow existing test patterns and conventions

## 💡 Tips

- Run tests frequently during development
- Keep tests simple and focused
- One assertion per test when possible
- Use descriptive test names
- Mock external dependencies
- Test both success and error cases

---

**Need Help?** Check the test output for specific error messages, or review the test files for examples of how to write similar tests.

