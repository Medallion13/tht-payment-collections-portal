export type DocumentType = "CC" | "NIT" | "CE" | "PA";
export type PaymentStatus = "CREATED" | "PAID" | "FAILED";

export interface CreatePaymentRequest {
  orderId: string;
  quoteId: string;
  fullName: string;
  documentType: DocumentType;
  document: string;
  email: string;
  cellPhone: string;
}

export interface CreatePaymentResponse {
  userId: string;
  paymentId: string;
  /** Redirect URL */
  paymentLink: string;
  status: PaymentStatus;
  quoteId: string;
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
