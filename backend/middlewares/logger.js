import Log from "../models/Apilog.js";

const apiLogger = (req, res, next) => {
  // 1. Capture the original response methods
  const originalJson = res.json;
  const originalSend = res.send;

  let responseBody = null;

  // 2. Intercept res.json calls
  res.json = function (body) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  // 3. Intercept res.send calls (fallback)
  res.send = function (body) {
    if (!responseBody) {
      try {
        responseBody = JSON.parse(body); // Try parsing if it's a JSON string
      } catch (e) {
        responseBody = body; // Keep as text if not JSON
      }
    }
    return originalSend.call(this, body);
  };

  // 4. Listen for the finish event to save to the database safely
  res.on('finish', async () => {
    try {
      // Don't log requests coming to the log dashboard itself!
      if (req.originalUrl.includes('/api-logs') || req.originalUrl.includes('/api/logs')) {
        return;
      }

      await Log.create({
        endpoint: req.originalUrl || "",
        method: req.method || "",
        statusCode: res.statusCode !== undefined ? res.statusCode : "",
        requestParams: req.params && Object.keys(req.params).length ? req.params : null,
        requestQuery: req.query && Object.keys(req.query).length ? req.query : null,
        requestBody: req.body && Object.keys(req.body).length ? req.body : null,
        response: responseBody
      });
    } catch (error) {
      console.error("Logger Middleware Error:", error);
    }
  });

  next();
};

export default apiLogger