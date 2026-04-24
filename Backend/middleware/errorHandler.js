const { validationResult } = require("express-validator");

// Run express-validator checks and return errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
};

module.exports = { validate, errorHandler };
