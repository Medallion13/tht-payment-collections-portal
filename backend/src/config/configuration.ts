export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  supra: {
    apiUrl: process.env.SUPRA_API_URL,
    clientId: process.env.SUPRA_CLIENT_ID,
    secret: process.env.SUPRA_SECRET,
  },
  // Database config
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
});
