/**
 * NewFlow Authentication Middleware
 * Simple authentication for NewFlow development
 */

const authMiddleware = (req, res, next) => {
  try {
    // For development, we'll use a simple token-based auth
    // In production, this would integrate with your actual auth system
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For development, create a mock user if no auth header
      req.user = {
        id: 'newflow-user-1',
        email: 'admin@newflow.com',
        name: 'NewFlow Admin',
        tenantId: 'test-tenant', // Match the seeded data
        userId: '507f1f77bcf86cd799439012', // Valid ObjectId format
        role: 'admin',
        flow: 'newflow'
      };
      return next();
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Accept both NewFlow tokens and JWT tokens for development
    if (token.startsWith('newflow-token-') || token.startsWith('eyJ')) {
      // For development, we'll use a simple approach
      // In production, this would decode the token to get user info
      
      // Try to find the user from the database based on the token
      // For now, we'll use a simple mapping approach
      req.user = {
        id: 'newflow-user-1',
        email: 'admin@newflow.com',
        name: 'NewFlow Admin',
        tenantId: 'test-tenant', // Match the seeded data
        userId: '507f1f77bcf86cd799439012', // Valid ObjectId format
        role: 'admin',
        flow: 'newflow'
      };
      
      // TODO: In production, decode token and fetch real user data
      // For now, the login route will set the correct user data in the response
      // and the frontend will store it in the user context
      
      next();
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
        flow: 'newflow'
      });
    }
  } catch (error) {
    console.error('NewFlow Auth Error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      flow: 'newflow',
      error: error.message
    });
  }
};

module.exports = authMiddleware;
