const checkIcccAuthorization = async (req, res, next) => {
  try {
    if (req.user?.role === 'admin') {
      req.isIcccOperator = true;
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Admin access is required for the ICCC command center.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = checkIcccAuthorization;
