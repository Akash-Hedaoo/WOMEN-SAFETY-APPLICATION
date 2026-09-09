/**
 * Keep token signing and verification on the same key.  The fallback is for
 * local development only; deployments must set both secrets in their env.
 */
const accessTokenSecret = process.env.JWT_SECRET || 'safe_era_jwt_secret_key_2026';
const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'safe_era_refresh_secret_key_2026';

module.exports = { accessTokenSecret, refreshTokenSecret };
