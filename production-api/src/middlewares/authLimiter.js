import rateLimit from "express-rate-limit";

export const registerLimiter = rateLimit({
  /*  15 minutes */
  windowMs: 15 * 60 * 1000,

  /*  limit each IP to 5 requests  */
  max: 5,
  message: "Too many registration attempts, try again later",
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts, try again later",
});
