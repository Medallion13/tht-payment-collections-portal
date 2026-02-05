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
  ProductId: string;
  product?: IProduct;

  quantity: number;
  totalAmountUsd: number;
  totalAmountCop: number;
  exchangeRate: number;

  status: OrderStatus;
  transactionId: string | null;
  createdAt: Date;
}
