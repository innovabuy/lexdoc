/**
 * LexDoc - Performance / Load Tests
 *
 * Uses autocannon for HTTP load testing
 * Run with: npx ts-node tests/performance/load-test.ts
 *
 * Requirements:
 * - Backend server must be running on PORT 3005
 * - Test user must exist (use seed data)
 */

import autocannon, { Result } from 'autocannon';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3005';
const TEST_EMAIL = 'admin@cabinet-demo.fr';
const TEST_PASSWORD = 'Admin123!';

interface LoadTestConfig {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: object;
  headers?: Record<string, string>;
  connections: number;
  duration: number;
  expectedLatency: number; // max acceptable mean latency in ms
}

let authToken: string | null = null;

/**
 * Get auth token for authenticated requests
 */
async function getAuthToken(): Promise<string> {
  if (authToken) return authToken;

  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  });

  const data = await response.json();
  authToken = data.data?.accessToken || data.accessToken;

  if (!authToken) {
    throw new Error('Failed to get auth token. Ensure seed data exists.');
  }

  return authToken;
}

/**
 * Run a single load test
 */
async function runLoadTest(config: LoadTestConfig): Promise<Result> {
  console.log(`\n📊 Running: ${config.name}`);
  console.log(`   URL: ${config.method} ${config.url}`);
  console.log(`   Connections: ${config.connections}, Duration: ${config.duration}s`);

  const token = await getAuthToken();

  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url: `${BASE_URL}${config.url}`,
      method: config.method,
      connections: config.connections,
      duration: config.duration,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...config.headers,
      },
      body: config.body ? JSON.stringify(config.body) : undefined,
    });

    autocannon.track(instance, { renderProgressBar: true });

    instance.on('done', (result) => {
      resolve(result);
    });

    instance.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Format test results
 */
function formatResults(name: string, result: Result, expectedLatency: number): {
  passed: boolean;
  summary: string;
} {
  const passed = result.latency.mean < expectedLatency && result.errors === 0;

  const summary = `
╔══════════════════════════════════════════════════════════════╗
║ ${name.padEnd(60)} ║
╠══════════════════════════════════════════════════════════════╣
║ Status:           ${passed ? '✅ PASSED' : '❌ FAILED'}                                      ║
║ Requests/sec:     ${result.requests.average.toFixed(2).padEnd(42)} ║
║ Latency (mean):   ${result.latency.mean.toFixed(2).padEnd(10)} ms (expected < ${expectedLatency}ms)             ║
║ Latency (p99):    ${result.latency.p99.toFixed(2).padEnd(42)} ms ║
║ Throughput:       ${(result.throughput.average / 1024).toFixed(2).padEnd(38)} KB/s ║
║ Errors:           ${result.errors.toString().padEnd(42)} ║
║ Timeouts:         ${result.timeouts.toString().padEnd(42)} ║
║ Total Requests:   ${result.requests.total.toString().padEnd(42)} ║
╚══════════════════════════════════════════════════════════════╝
`;

  return { passed, summary };
}

/**
 * Load test configurations
 */
const loadTests: LoadTestConfig[] = [
  // Light load tests (10 connections)
  {
    name: 'Health Check - Light Load',
    url: '/api/health',
    method: 'GET',
    connections: 10,
    duration: 10,
    expectedLatency: 50,
  },
  {
    name: 'Document Blocks List - Light Load',
    url: '/api/document-blocks?limit=20',
    method: 'GET',
    connections: 10,
    duration: 10,
    expectedLatency: 200,
  },
  {
    name: 'Builder Templates List - Light Load',
    url: '/api/builder-templates?limit=10',
    method: 'GET',
    connections: 10,
    duration: 10,
    expectedLatency: 200,
  },

  // Medium load tests (25 connections)
  {
    name: 'Document Blocks List - Medium Load',
    url: '/api/document-blocks?limit=50',
    method: 'GET',
    connections: 25,
    duration: 15,
    expectedLatency: 300,
  },
  {
    name: 'Document Blocks by Category - Medium Load',
    url: '/api/document-blocks?category=INTRO',
    method: 'GET',
    connections: 25,
    duration: 15,
    expectedLatency: 300,
  },
  {
    name: 'Folders List - Medium Load',
    url: '/api/folders',
    method: 'GET',
    connections: 25,
    duration: 15,
    expectedLatency: 200,
  },

  // Heavy load tests (50 connections)
  {
    name: 'Authentication - Heavy Load',
    url: '/api/auth/me',
    method: 'GET',
    connections: 50,
    duration: 20,
    expectedLatency: 300,
  },
  {
    name: 'Document Blocks List - Heavy Load',
    url: '/api/document-blocks',
    method: 'GET',
    connections: 50,
    duration: 20,
    expectedLatency: 500,
  },
  {
    name: 'Builder Templates List - Heavy Load',
    url: '/api/builder-templates',
    method: 'GET',
    connections: 50,
    duration: 20,
    expectedLatency: 500,
  },

  // Spike test (100 connections for short burst)
  {
    name: 'Health Check - Spike Test',
    url: '/api/health',
    method: 'GET',
    connections: 100,
    duration: 10,
    expectedLatency: 100,
  },
];

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           LexDoc Performance / Load Test Suite               ║');
  console.log('║                                                              ║');
  console.log(`║ Target: ${BASE_URL.padEnd(52)} ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  const results: { name: string; passed: boolean; summary: string }[] = [];

  try {
    // First, verify we can get an auth token
    console.log('\n🔐 Authenticating...');
    await getAuthToken();
    console.log('✅ Authentication successful\n');

    // Run each test
    for (const test of loadTests) {
      try {
        const result = await runLoadTest(test);
        const formatted = formatResults(test.name, result, test.expectedLatency);
        results.push({ name: test.name, ...formatted });
        console.log(formatted.summary);
      } catch (error) {
        console.error(`❌ Test "${test.name}" failed:`, error);
        results.push({
          name: test.name,
          passed: false,
          summary: `Test failed with error: ${error}`,
        });
      }
    }

    // Summary
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    FINAL SUMMARY                             ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║ Total Tests:  ${results.length.toString().padEnd(47)} ║`);
    console.log(`║ Passed:       ${passed.toString().padEnd(47)} ║`);
    console.log(`║ Failed:       ${failed.toString().padEnd(47)} ║`);
    console.log(`║ Success Rate: ${((passed / results.length) * 100).toFixed(1)}%                                          ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');

    if (failed > 0) {
      console.log('\n❌ Failed tests:');
      results.filter((r) => !r.passed).forEach((r) => console.log(`   - ${r.name}`));
      process.exit(1);
    } else {
      console.log('\n✅ All performance tests passed!');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllTests();
}

export { runAllTests, runLoadTest, LoadTestConfig };
