export interface AppBalance {
  usd: number;
  cop: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}
