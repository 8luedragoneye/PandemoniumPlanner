import { Response } from 'express';

// Simple error handler utility
export function handleError(res: Response, error: unknown, defaultMessage: string): void {
  const message = error instanceof Error ? error.message : defaultMessage;
  console.error(defaultMessage, error);
  res.status(500).json({ error: message });
}

// Validation error handler
export function handleValidationError(res: Response, message: string): void {
  res.status(400).json({ error: message });
}

// Not found error handler
export function handleNotFound(res: Response, resource: string): void {
  res.status(404).json({ error: `${resource} not found` });
}

// Unauthorized error handler
export function handleUnauthorized(res: Response, message = 'Not authorized'): void {
  res.status(403).json({ error: message });
}
