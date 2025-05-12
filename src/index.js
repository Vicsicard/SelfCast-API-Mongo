/**
 * SelfCast API - MongoDB Edition
 * Main server file
 */

const app = require('./app');

// Define port
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the API at http://localhost:${PORT}`);
});
