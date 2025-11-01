import { createServer } from 'http';
import { config } from './config/env.js';
import { testConnection } from './config/database.js';
import { handleRequest } from './router.js';

/**
 * Start the HTTP server
 */
async function startServer() {
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  // Create HTTP server
  const server = createServer(handleRequest);

  // Start listening
  server.listen(config.port, () => {
    console.log('\n🚀 Vacation Portal API Server');
    console.log('================================');
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Server running on: http://localhost:${config.port}`);
    console.log(`CORS enabled for: ${config.cors.origin}`);
    console.log('================================\n');
    console.log('Available endpoints:');
    console.log('  POST   /api/auth/login');
    console.log('  GET    /api/auth/me');
    console.log('  GET    /api/users');
    console.log('  POST   /api/users');
    console.log('  GET    /api/users/:id');
    console.log('  PUT    /api/users/:id');
    console.log('  DELETE /api/users/:id');
    console.log('  GET    /api/requests');
    console.log('  POST   /api/requests');
    console.log('  GET    /api/requests/:id');
    console.log('  PUT    /api/requests/:id');
    console.log('  PUT    /api/requests/:id/approve');
    console.log('  PUT    /api/requests/:id/reject');
    console.log('  DELETE /api/requests/:id');
    console.log('  GET    /api/analytics');
    console.log('\n');
  });

  // Handle server errors
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${config.port} is already in use`);
    } else {
      console.error('Server error:', error);
    }
    process.exit(1);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n\nShutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
