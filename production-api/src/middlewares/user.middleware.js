export const isUser = (req, res, next) => {
  if (req.user.role !== "USER") {
    return res.status(403).json({
      message: "User access only!",
    });
  }
  next();
};
