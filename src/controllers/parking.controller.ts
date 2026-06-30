import { Request, Response } from 'express';
import { ParkingLotManager } from '../services/ParkingLotManager';
import { AiAssistantService } from '../services/AiAssistantService';
import { logger } from '../utils/logger';

const manager = new ParkingLotManager();

export class ParkingController {
    static async checkIn(req: Request, res: Response): Promise<void> {
        try {
            const { license_plate, vehicle_type } = req.body;
            
            const { ticket, spot } = await manager.checkIn(license_plate, vehicle_type);
            logger.info('Vehicle checked in successfully', { ticketId: ticket.id, licensePlate: license_plate });
            
            res.status(201).json({
                ticket_id: ticket.id,
                spot: `Floor ${spot.floorNumber}, Spot ${spot.spotNumber} (${spot.spotType})`,
                entry_time: ticket.entryTime
            });
        } catch (error: any) {
            logger.error('Check-in failed', { error: error.message });
            if (error.message.includes('No spots available') || error.message.includes('Race condition')) {
                res.status(409).json({ error: error.message });
            } else if (error.message.includes('already checked in')) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal server error', details: error.message });
            }
        }
    }

    static async checkOut(req: Request, res: Response): Promise<void> {
        try {
            const { ticket_id } = req.body;
            
            const ticket = await manager.checkOut(ticket_id);
            logger.info('Vehicle checked out successfully', { ticketId: ticket.id, fee: ticket.fee });
            
            res.status(200).json({
                license_plate: ticket.licensePlate,
                fee: ticket.fee,
                duration_minutes: (new Date(ticket.exitTime!).getTime() - new Date(ticket.entryTime).getTime()) / (1000 * 60),
                status: ticket.status
            });
        } catch (error: any) {
            logger.error('Check-out failed', { error: error.message });
            if (error.message.includes('Ticket not found')) {
                res.status(404).json({ error: error.message });
            } else if (error.message.includes('already processed') || error.message.includes('Clock skew')) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal server error', details: error.message });
            }
        }
    }

    static async getAvailability(req: Request, res: Response): Promise<void> {
        try {
            const availability = await manager.getAvailability();
            res.status(200).json(availability);
        } catch (error: any) {
            logger.error('Failed to get availability', { error: error.message });
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }

    static async askAssistant(req: Request, res: Response): Promise<void> {
        try {
            const { query, history } = req.body;

            const aiService = new AiAssistantService(manager);
            const answer = await aiService.askAssistant(query, history || []);
            
            logger.info('AI Assistant replied', { query });
            res.status(200).json({ answer });
        } catch (error: any) {
            logger.error('AI Assistant failed', { error: error.message });
            res.status(500).json({ error: 'Failed to process AI request', details: error.message });
        }
    }
}
