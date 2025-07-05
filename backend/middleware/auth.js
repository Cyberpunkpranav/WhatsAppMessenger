/**
 * Authentication middleware to protect routes
 * Checks if user is logged in via session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authMiddleware = (req, res, next) => {
  const token = req.cookies.accessToken; // from cookie
  // OR: const token = req.headers.authorization?.split(' ')[1]; // if using headers

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded; // 👈 attach payload (userId, roleId, username) here
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

/**
 * Middleware to check if user owns the resource
 * Used for routes that access resources by user ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const ownershipMiddleware = (req, res, next) => {
  const resourceUserId = parseInt(req.params.userId || req.params.id);
  const currentUserId = req.session.userId;

  if (resourceUserId !== currentUserId) {
    return res.status(403).json({
      message: 'Access denied',
      code: 'FORBIDDEN'
    });
  }

  next();
};

/**
 * Optional authentication middleware
 * Adds user info to request if authenticated, but doesn't block access
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const optionalAuthMiddleware = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
    req.isAuthenticated = true;
  } else {
    req.isAuthenticated = false;
  }

  next();
};