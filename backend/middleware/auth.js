const jwt = require('jsonwebtoken');
const config = require('../config');
const { AppError } = require('../errors');

function signToken(user) {
  return jwt.sign({ sub: String(user._id), username: user.username, role: user.role }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn,
  });
}

/** Requires `Authorization: Bearer <jwt>`; sets req.user = { id, username, role }. */
function authenticate(req, _res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Missing bearer token');
  }
  try {
    const claims = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    req.user = { id: claims.sub, username: claims.username, role: claims.role };
    next();
  } catch {
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token');
  }
}

// Each role includes the privileges of the ones before it.
const RANK = { viewer: 1, operator: 2, admin: 3 };

function requireRole(minimumRole) {
  return (req, _res, next) => {
    if ((RANK[req.user?.role] ?? 0) < RANK[minimumRole]) {
      throw new AppError(403, 'FORBIDDEN', `This action requires the "${minimumRole}" role`);
    }
    next();
  };
}

module.exports = { signToken, authenticate, requireRole };
