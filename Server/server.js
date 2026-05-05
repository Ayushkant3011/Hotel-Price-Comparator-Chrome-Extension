// Load environment variables first
require('dotenv').config();

const app = require('./app');

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
  console.log(`API base: http://localhost:${port}/api`);
  console.log(`Health check: http://localhost:${port}/`);
});