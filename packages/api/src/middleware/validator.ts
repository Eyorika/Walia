import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { HTTP_STATUS } from '@waliabet/shared';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors: Record<string, string[]> = {};

      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      });

      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        errors,
      });
      return;
    }

    req[source] = result.data;
    next();
  };
}
