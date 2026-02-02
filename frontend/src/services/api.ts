import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const client = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const api = {
  healthCheck: async () => {
    const response = await client.get("/health");
    return response.data;
  },

  getQuote: async (amount: number) => {
    const amountFactor = Math.round(amount * 100);
    const response = await client.post("/api/payment/quote", {
      amount: amountFactor,
    });
    return response.data;
  },
};
