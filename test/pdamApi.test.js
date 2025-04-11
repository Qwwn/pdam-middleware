const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");
const { handleBillInfo, clearCache } = require("../lib/pdamApi");

// Mock environment variables
process.env.PDAM_API_URL = "http://mockapi.com/api";
process.env.API_AUTH_TOKEN = "mock-token";

describe("PDAM API Handler", () => {
  let mockAxios;
  let req;
  let res;

  beforeEach(() => {
    // Clear cache before each test
    clearCache();

    // Setup mock axios
    mockAxios = new MockAdapter(axios);

    // Mock request and response objects
    req = {
      body: { customerNumber: "123456789" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    mockAxios.reset();
  });

  test("should return 400 if customerNumber is missing", async () => {
    req.body = {};

    await handleBillInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      message: "Customer number is required",
    });
  });

  test("should return 400 if customerNumber is invalid", async () => {
    req.body = { customerNumber: "abc123" };

    await handleBillInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      message: "Customer number must contain only digits",
    });
  });

  test("should successfully fetch and return bill info", async () => {
    const mockResponse = {
      error: false,
      message_code: 100,
      cust_data: [{ NOSAMBUNG: "123456789" }],
    };

    mockAxios.onPost(process.env.PDAM_API_URL).reply(200, mockResponse);

    await handleBillInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResponse);
  });

  test("should handle API error responses", async () => {
    const errorResponse = {
      error: true,
      message: "API error occurred",
    };

    mockAxios.onPost(process.env.PDAM_API_URL).reply(500, errorResponse);

    await handleBillInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(errorResponse);
  });

  test("should handle connection timeout", async () => {
    mockAxios.onPost(process.env.PDAM_API_URL).timeout();

    await handleBillInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(504);
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      message: "Request to PDAM API timed out",
    });
  });

  test("should return cached data for repeated requests", async () => {
    const mockResponse = {
      error: false,
      message_code: 100,
      cust_data: [{ NOSAMBUNG: "123456789" }],
    };

    mockAxios.onPost(process.env.PDAM_API_URL).reply(200, mockResponse);

    // First call
    await handleBillInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResponse);

    // Reset the mocks
    res.status.mockClear();
    res.json.mockClear();

    // Set up mock to verify it's not called again
    mockAxios.onPost(process.env.PDAM_API_URL).reply(500, {
      error: true,
      message: "This should not be called",
    });

    // Second call with same customer number should use cache
    await handleBillInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResponse);
  });
});
