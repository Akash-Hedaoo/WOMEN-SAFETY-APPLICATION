const User = require('../models/User');

const checkIcccAuthorization = async (req, res, next) => {
  try {
    // 1. Check for demo passcode header if provided
    const demoPasscode = req.headers['x-iccc-passcode'];
    const validPasscodes = ['COMMAND112', 'OPERATOR2026', process.env.ICCC_PASSCODE].filter(Boolean);
    
    if (demoPasscode && validPasscodes.includes(demoPasscode.trim())) {
      req.isIcccOperator = true;
      return next();
    }

    // 2. Check authenticated user's email against allowlist or role
    if (req.user) {
      const allowedEmails = (process.env.ICCC_OPERATOR_EMAILS || 'admin@safeera.org,operator@safeera.org,command@safeera.org')
        .split(',')
        .map(e => e.trim().toLowerCase());
        
      if (req.user.role === 'admin' || req.user.role === 'operator' || allowedEmails.includes(req.user.email?.toLowerCase())) {
        req.isIcccOperator = true;
        return next();
      }
    }

    // Default: allow demo mode in development if header or query param present, else forbid
    if (process.env.NODE_ENV !== 'production' && req.headers['x-demo-operator'] === 'true') {
      req.isIcccOperator = true;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access Restricted: You are not an authorized ICCC control room operator.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = checkIcccAuthorization;
