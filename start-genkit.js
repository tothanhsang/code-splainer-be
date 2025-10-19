#!/usr/bin/env node

const dotenv = require('dotenv');
const { ReflectionServer } = require('genkit');
const { ai } = require('./dist/config/gemini');
const { analyzeSpecFlow } = require('./dist/services/aiAnalysis.service');

// Load environment variables
dotenv.config();

// Make sure flows are loaded
console.log('🚀 Starting Genkit Dev UI...');
console.log('Available flows:');
console.log('- analyzeSpecFlow');

// Start the reflection server (Dev UI)
const server = new ReflectionServer({
  api: ai,
  port: 4000,
});

// Start the server
server.start().then(() => {
  console.log('✅ Genkit Dev UI is running at http://localhost:4000');
  console.log('📊 Make sure your main server is running in another terminal');
  console.log('');
  console.log('Press Ctrl+C to stop the Dev UI');
}).catch((error) => {
  console.error('❌ Failed to start Genkit Dev UI:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Genkit Dev UI...');
  server.stop().then(() => {
    console.log('✅ Genkit Dev UI stopped');
    process.exit(0);
  });
});