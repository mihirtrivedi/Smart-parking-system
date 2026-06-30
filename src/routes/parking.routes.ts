import { Router } from 'express';
import { ParkingController } from '../controllers/parking.controller';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

const checkInSchema = z.object({
    license_plate: z.string().min(1),
    vehicle_type: z.enum(['MOTORCYCLE', 'CAR', 'BUS'])
});

const checkOutSchema = z.object({
    ticket_id: z.string().uuid()
});

const aiSchema = z.object({
    query: z.string().min(1),
    history: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string()
    })).optional()
});

router.post('/check-in', validate(checkInSchema), ParkingController.checkIn);
router.post('/check-out', validate(checkOutSchema), ParkingController.checkOut);
router.get('/availability', ParkingController.getAvailability);
router.post('/assistant', validate(aiSchema), ParkingController.askAssistant);

export default router;
