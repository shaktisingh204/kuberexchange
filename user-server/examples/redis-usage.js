/**
 * Redis Usage Examples
 * Demonstrates how to use the new Redis setup in your project
 */

const { redisService, cacheService } = require('../madara/models/redis-new');

// Example 1: Basic Redis operations
async function basicRedisExample() {
  console.log('=== Basic Redis Operations ===');
  
  // Set and get a simple value
  await redisService.set('test:key', 'Hello Redis!');
  const value = await redisService.get('test:key');
  console.log('Retrieved value:', value);
  
  // Set with TTL (Time To Live)
  await redisService.set('test:ttl', 'This will expire in 10 seconds', 10);
  
  // Hash operations
  await redisService.hset('user:123', 'name', 'John Doe');
  await redisService.hset('user:123', 'email', 'john@example.com');
  const user = await redisService.hgetall('user:123');
  console.log('User data:', user);
}

// Example 2: Cache service usage
async function cacheServiceExample() {
  console.log('=== Cache Service Operations ===');
  
  // Cache user data
  const userData = {
    id: 123,
    name: 'John Doe',
    email: 'john@example.com',
    balance: 1000
  };
  
  await cacheService.cacheUser(123, userData);
  const cachedUser = await cacheService.getCachedUser(123);
  console.log('Cached user:', cachedUser);
  
  // Cache market data
  const marketData = {
    id: 'market_123',
    name: 'IPL Match',
    odds: { home: 1.5, away: 2.5 }
  };
  
  await cacheService.cacheMarket('market_123', marketData);
  const cachedMarket = await cacheService.getCachedMarket('market_123');
  console.log('Cached market:', cachedMarket);
}

// Example 3: Session management
async function sessionExample() {
  console.log('=== Session Management ===');
  
  const sessionId = 'sess_123456';
  const sessionData = {
    userId: 123,
    username: 'john_doe',
    loginTime: new Date().toISOString()
  };
  
  await redisService.setSession(sessionId, sessionData);
  const session = await redisService.getSession(sessionId);
  console.log('Session data:', session);
  
  // Destroy session
  await redisService.destroySession(sessionId);
}

// Example 4: Rate limiting
async function rateLimitExample() {
  console.log('=== Rate Limiting ===');
  
  const userIp = '192.168.1.100';
  const rateLimitKey = `rate_limit:${userIp}`;
  
  for (let i = 1; i <= 5; i++) {
    const result = await redisService.checkRateLimit(rateLimitKey, 5, 60);
    console.log(`Request ${i}:`, result);
  }
}

// Example 5: Pub/Sub messaging
async function pubSubExample() {
  console.log('=== Pub/Sub Messaging ===');
  
  const channel = 'notifications';
  
  // Subscribe to channel
  await redisService.subscribe(channel, (message) => {
    console.log('Received message:', message);
  });
  
  // Publish message
  await redisService.publish(channel, {
    type: 'user_notification',
    userId: 123,
    message: 'You have a new bet!'
  });
}

// Example 6: Batch operations
async function batchOperationsExample() {
  console.log('=== Batch Operations ===');
  
  const users = [
    { key: 'user:1', value: { name: 'Alice', age: 30 } },
    { key: 'user:2', value: { name: 'Bob', age: 25 } },
    { key: 'user:3', value: { name: 'Charlie', age: 35 } }
  ];
  
  await redisService.cacheMultiple(users, 3600);
  
  const user1 = await redisService.get('user:1');
  const user2 = await redisService.get('user:2');
  console.log('Batch cached users:', user1, user2);
}

// Example 7: Cache statistics
async function cacheStatsExample() {
  console.log('=== Cache Statistics ===');
  
  const stats = await cacheService.getCacheStats('user:*');
  console.log('Cache stats:', stats);
}

// Example 8: Error handling
async function errorHandlingExample() {
  console.log('=== Error Handling ===');
  
  try {
    await redisService.get('non:existent:key');
    console.log('Key retrieved successfully');
  } catch (error) {
    console.error('Error retrieving key:', error.message);
  }
}

// Run all examples
async function runAllExamples() {
  try {
    console.log('🚀 Starting Redis examples...\n');
    
    await basicRedisExample();
    console.log('\n');
    
    await cacheServiceExample();
    console.log('\n');
    
    await sessionExample();
    console.log('\n');
    
    await rateLimitExample();
    console.log('\n');
    
    await batchOperationsExample();
    console.log('\n');
    
    await cacheStatsExample();
    console.log('\n');
    
    await errorHandlingExample();
    console.log('\n');
    
    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Export examples for use in other files
module.exports = {
  basicRedisExample,
  cacheServiceExample,
  sessionExample,
  rateLimitExample,
  pubSubExample,
  batchOperationsExample,
  cacheStatsExample,
  errorHandlingExample,
  runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}
