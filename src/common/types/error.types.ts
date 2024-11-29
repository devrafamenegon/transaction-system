export type AppError = Error & {
  code?: string;
  details?: Record<string, any>;
};

export type DatabaseError = Error & {
  code: string;
  constraint?: string;
  detail?: string;
};

export type ValidationError = Error & {
  constraints?: Record<string, string>;
  children?: ValidationError[];
};
