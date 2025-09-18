/**
 * Flow Middleware for NewFlow Development
 * This middleware handles routing between current flow and new flow
 */

const flowMiddleware = (req, res, next) => {
  // Check if this is a NewFlow request
  const isNewFlowRequest = req.path.startsWith('/api/newflow');
  
  if (isNewFlowRequest) {
    // Add NewFlow context to request
    req.flowType = 'newflow';
    req.flowVersion = '2.0.0-beta';
    
    // Log NewFlow requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 NewFlow Request: ${req.method} ${req.path}`);
    }
    
    // Don't modify the URL - let the routes handle it
    // The routes are already registered with /api/newflow prefix
  } else {
    // Current flow request
    req.flowType = 'current';
    req.flowVersion = '1.0.0';
  }
  
  next();
};

/**
 * NewFlow specific error handler
 */
const newFlowErrorHandler = (err, req, res, next) => {
  if (req.flowType === 'newflow') {
    console.error('🚀 NewFlow Error:', err);
    
    // Custom error response for NewFlow
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'NewFlow Internal Server Error',
      flow: 'newflow',
      version: req.flowVersion,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  } else {
    next(err);
  }
};

/**
 * NewFlow response formatter
 */
const newFlowResponseFormatter = (req, res, next) => {
  if (req.flowType === 'newflow') {
    const originalJson = res.json;
    
    res.json = function(data) {
      // Add NewFlow metadata to all responses
      const newFlowResponse = {
        ...data,
        flow: 'newflow',
        version: req.flowVersion,
        timestamp: new Date().toISOString()
      };
      
      return originalJson.call(this, newFlowResponse);
    };
  }
  
  next();
};

module.exports = {
  flowMiddleware,
  newFlowErrorHandler,
  newFlowResponseFormatter
};
