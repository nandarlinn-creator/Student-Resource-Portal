/**
 * Protect routes — redirect unauthenticated users to login.
 */
exports.requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.redirect("/auth/login");
  }
  next();
};

/**
 * Redirect authenticated users away from login/register pages.
 */
exports.redirectIfAuth = (req, res, next) => {
  if (req.session?.userId) {
    return res.redirect("/projects");
  }
  next();
};

/**
 * Role-based access — usage: requireRole("admin") or requireRole("faculty", "admin")
 */
exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Unauthorised" });
    }
    if (!roles.includes(req.session.userRole)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };
};
