// Server configuration
// All sensitive values must be provided via environment variables
// Note: dotenv loads before this is imported

export const config = {
  get jwtSecret() {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    return process.env.JWT_SECRET;
  },
  get miniMaxApiKey() {
    if (!process.env.MINIMAX_API_KEY) {
      throw new Error('MINIMAX_API_KEY environment variable is not set');
    }
    return process.env.MINIMAX_API_KEY;
  },
  get port() {
    return parseInt(process.env.PORT || '3001', 10);
  },
};
