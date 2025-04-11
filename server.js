// server.js - for local development
const app = require("./api/index");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Debug environment variables
console.log("Environment variables:");
console.log("- PDAM_API_URL:", process.env.PDAM_API_URL);
console.log(
  "- API_AUTH_TOKEN:",
  process.env.API_AUTH_TOKEN ? "[SET]" : "[NOT SET]"
);

// Start server
app.listen(PORT, () => {
  console.log(`Local development server running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api`);
  console.log(`Bill info endpoint: http://localhost:${PORT}/api/bill-info`);
});
