import { IProduct } from "./product.types";
import { IUser } from "./user.types";

export enum OrderStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface IOrder {
  id: string;
  user?: IUser;
  productId: string;
  product?: IProduct;

  quantity: number;
  totalAmountUsd: number;
  totalAmountCop: number | null;
  exchangeRate: number | null;

  status: OrderStatus;
  transactionId: string | null;
  createdAt: Date;
}
