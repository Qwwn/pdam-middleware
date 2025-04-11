const axios = require("axios");
const FormData = require("form-data");
const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 300 });

async function handleBillInfo(req, res) {
  try {
    if (!process.env.PDAM_API_URL) {
      throw new Error("PDAM_API_URL environment variable is not set");
    }

    if (!process.env.API_AUTH_TOKEN) {
      throw new Error("API_AUTH_TOKEN environment variable is not set");
    }

    const { customerNumber } = req.body;

    if (!customerNumber) {
      return res.status(400).json({
        error: true,
        message: "Customer number is required",
      });
    }

    if (!/^\d+$/.test(customerNumber)) {
      return res.status(400).json({
        error: true,
        message: "Customer number must contain only digits",
      });
    }

    const cacheKey = `customer_${customerNumber}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      console.log(`Returning cached data for customer: ${customerNumber}`);
      return res.status(200).json(cachedData);
    }

    console.log(`Processing request for customer: ${customerNumber}`);

    const formData = new FormData();
    formData.append("nosambung", customerNumber);

    const headers = {
      Authorization: process.env.API_AUTH_TOKEN,
      ...formData.getHeaders(),
    };

    const requestConfig = {
      headers,
      timeout: 10000,
    };

    const response = await axios.post(
      process.env.PDAM_API_URL,
      formData,
      requestConfig
    );

    cache.set(cacheKey, response.data);

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error processing request:", error.message);

    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        error: true,
        message: "Request to PDAM API timed out",
      });
    }

    if (error.code === "ENOTFOUND") {
      return res.status(502).json({
        error: true,
        message: "Could not connect to PDAM API server",
      });
    }

    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data || {
        error: true,
        message: `API returned status ${status}`,
      };

      return res.status(status).json(responseData);
    }

    return res.status(500).json({
      error: true,
      message: `API error: ${error.message}`,
    });
  }
}

function clearCache() {
  cache.flushAll();
}

module.exports = {
  handleBillInfo,
  clearCache,
};
