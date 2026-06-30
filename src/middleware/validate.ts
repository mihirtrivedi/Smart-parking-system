import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { logger } from '../utils/logger';

export function validate(schema: z.ZodObject<any, any>) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                logger.warn('Validation failed', { errors: error.issues });
                res.status(400).json({ error: 'Validation failed', details: error.issues });
                return;
            }
            next(error);
        }
    };
}
