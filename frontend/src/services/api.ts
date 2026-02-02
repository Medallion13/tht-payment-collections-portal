import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface CreatePaymentRequest {
  quoteId: string;
  fullName: string;
  documentType: string;
  document: string;
  email: string;
  cellPhone: string;
}

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

  createPayment: async (data: CreatePaymentRequest) => {
    const response = await client.post("/api/payment/process", data);
    return response.data;
  },

  getPaymentStatus: async (paymentId: string) => {
    const response = await client.get(`/api/payment/status/${paymentId}`);
    return response.data;
  },

  getBalances: async () => {
    const response = await client.get("/api/payment/balances");
    return response.data;
  },
};
