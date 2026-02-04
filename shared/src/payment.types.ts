export type DocumentType = "CC" | "NIT" | "CE" | "PA";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface CreatePaymentRequest {
  quoteId: string;
  documentType: DocumentType;
  document: string;
  email: string;
  cellPhone: string;
}

export interface PaymentStatusResponse {
  paymentId: string;
  status: PaymentStatus;
  amount: number; //factor 100
  currency: string;
  fullName: string;
  email: string;
  createdAt: string; // ISO Date String
}
