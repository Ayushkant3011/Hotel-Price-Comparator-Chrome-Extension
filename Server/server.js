// Load environment variables first
require('dotenv').config();

const app = require('./app');
const connectDB = require('./utils/db');

const port = process.env.PORT || 3000;
// Connect to MongoDB, then start the server
connectDB().then(() => {
  console.log("db is connected");
  app.listen(port, () => {
    console.log("server connected");
    console.log(`API base: http://localhost:${port}/api`);
    console.log(`Health check: http://localhost:${port}/`);
  });
});