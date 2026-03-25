// Middleware to enable Node.js compatibility for all Functions
export const onRequest = async (context) => {
  return await context.next();
};
