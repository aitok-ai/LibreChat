module.exports = function createUploadQuotaMiddleware(opts) {
  const perFileLimit = opts?.perFileLimitBytes ?? 2 * 1024 * 1024 * 1024;
  const totalLimit = opts?.totalLimitBytes ?? 10 * 1024 * 1024 * 1024;
  return function enforceUploadQuota(req, res, next) {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > perFileLimit) {
      res.status(413).json({ error: 'Upload exceeds per-file size limit' });
      return;
    }
    if (contentLength > 0 && contentLength > totalLimit) {
      res.status(413).json({ error: 'Upload exceeds total allowed size' });
      return;
    }
    next();
  };
};
