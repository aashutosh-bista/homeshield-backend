// This is a utility function to handle asynchronous request handlers in Express.js.
//for webrequests, we often have to deal with asynchronous operations, such as database queries or API calls. When we write request handlers that involve these asynchronous operations, we need to handle errors properly. If an error occurs in an asynchronous operation and we don't catch it, it can lead to unhandled promise rejections and potentially crash the server. The asyncHandler function is a higher-order function that takes an asynchronous request handler as an argument and returns a new function that wraps the original handler in a try-catch block. This way, if any error occurs during the execution of the asynchronous handler, it will be caught and passed to the next middleware (which is typically an error-handling middleware) using the next function. This helps to ensure that errors are handled gracefully and prevents unhandled promise rejections from crashing the server.
//asyncHandler is meant for Express route handlers
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
