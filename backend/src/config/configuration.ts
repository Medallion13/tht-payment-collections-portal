export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  supra: {
    apiUrl: process.env.SUPRA_API_URL,
    clientId: process.env.SUPRA_CLIENT_ID,
    secret: process.env.SUPRA_SECRET,
  },
});

// TODO: Check zoi to ensure the variables exists
