import { PrismaClient, Ticket, Vehicle } from '@prisma/client';
import { SpotAllocationStrategy } from '../strategies/SpotAllocationStrategy';
import { FeeStrategyFactory } from '../strategies/FeeCalculationStrategy';

export class ParkingLotManager {
    private prisma: PrismaClient;
    private allocationStrategy: SpotAllocationStrategy;

    constructor() {
        this.prisma = new PrismaClient();
        this.allocationStrategy = new SpotAllocationStrategy(this.prisma);
    }

    async checkIn(licensePlate: string, vehicleType: string): Promise<{ ticket: Ticket, spot: any }> {
        // Idempotency Check: See if vehicle already has an active ticket
        const existingTicket = await this.prisma.ticket.findFirst({
            where: { licensePlate, status: 'ACTIVE' }
        });
        if (existingTicket) {
            throw new Error('Vehicle already checked in.');
        }

        // Ensure Vehicle exists in DB
        await this.prisma.vehicle.upsert({
            where: { licensePlate },
            update: { vehicleType },
            create: { licensePlate, vehicleType }
        });

        // Optimistic Concurrency Control Retry Loop
        const MAX_RETRIES = 3;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            // 1. Find spot
            const spot = await this.allocationStrategy.findSpot(vehicleType);
            if (!spot) {
                throw new Error('No spots available for your vehicle type.');
            }

            try {
                // 2. Mark Spot as OCCUPIED and generate Ticket using a transaction
                const ticket = await this.prisma.$transaction(async (tx) => {
                    const updatedSpot = await tx.parkingSpot.updateMany({
                        where: { 
                            id: spot.id, 
                            version: spot.version, 
                            status: 'AVAILABLE' 
                        },
                        data: { 
                            status: 'OCCUPIED', 
                            version: { increment: 1 } 
                        }
                    });

                    // If count is 0, someone else updated this specific spot in the last millisecond
                    if (updatedSpot.count === 0) {
                        throw new Error('OCC_CONFLICT');
                    }

                    const createdTicket = await tx.ticket.create({
                        data: {
                            licensePlate,
                            spotId: spot.id,
                            status: 'ACTIVE'
                        }
                    });
                    return { ticket: createdTicket, spot };
                });
                
                return ticket; // Success
                
            } catch (error: any) {
                if (error.message === 'OCC_CONFLICT' && attempt < MAX_RETRIES) {
                    continue; // Loop back and try to find the next available spot
                } else if (error.message === 'OCC_CONFLICT') {
                    throw new Error('Race condition: High traffic. Please try again.');
                }
                throw error;
            }
        }
        
        throw new Error('Unexpected error during check-in.');
    }

    async checkOut(ticketId: string): Promise<Ticket> {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { vehicle: true, spot: true }
        });

        if (!ticket) throw new Error('Ticket not found.');
        if (ticket.status === 'COMPLETED') throw new Error('Ticket already processed/paid.');

        const exitTime = new Date();
        if (exitTime < ticket.entryTime) throw new Error('Clock skew detected: Exit time is before entry time.');

        const feeStrategy = FeeStrategyFactory.getStrategy(ticket.vehicle.vehicleType);
        const fee = feeStrategy.calculateFee(ticket.entryTime, exitTime);

        // Update Spot and Ticket in Transaction
        return await this.prisma.$transaction(async (tx) => {
            await tx.parkingSpot.update({
                where: { id: ticket.spotId },
                data: { status: 'AVAILABLE', version: { increment: 1 } }
            });

            return tx.ticket.update({
                where: { id: ticketId },
                data: {
                    status: 'COMPLETED',
                    exitTime,
                    fee
                }
            });
        });
    }

    async getAvailability(): Promise<Record<string, number>> {
        const spots = await this.prisma.parkingSpot.groupBy({
            by: ['spotType'],
            where: { status: 'AVAILABLE' },
            _count: { _all: true }
        });

        const availability: Record<string, number> = { SMALL: 0, MEDIUM: 0, LARGE: 0 };
        for (const s of spots) {
            availability[s.spotType] = s._count._all;
        }

        return availability;
    }
    async getTicketDetails(ticketId: string) {
        return this.prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { spot: true }
        });
    }
}
