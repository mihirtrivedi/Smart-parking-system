import { PrismaClient, ParkingSpot } from '@prisma/client';

export class SpotAllocationStrategy {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    private getEligibleSpotTypes(vehicleType: string): string[] {
        switch (vehicleType) {
            case 'MOTORCYCLE': return ['SMALL', 'MEDIUM', 'LARGE'];
            case 'CAR': return ['MEDIUM', 'LARGE'];
            case 'BUS': return ['LARGE'];
            default: throw new Error(`Unknown vehicle type: ${vehicleType}`);
        }
    }

    async findSpot(vehicleType: string): Promise<ParkingSpot | null> {
        const eligibleTypes = this.getEligibleSpotTypes(vehicleType);

        // Fetch nearest available spot ordered by floor and spot number
        const spot = await this.prisma.parkingSpot.findFirst({
            where: {
                status: 'AVAILABLE',
                spotType: { in: eligibleTypes }
            },
            orderBy: [
                { floorNumber: 'asc' },
                { spotNumber: 'asc' }
            ]
        });

        return spot;
    }
}
