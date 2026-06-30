import { Ticket } from '@prisma/client';

export interface FeeCalculationStrategy {
    calculateFee(entryTime: Date, exitTime: Date): number;
}

const GRACE_PERIOD_MINUTES = 15;

export abstract class BaseFeeStrategy implements FeeCalculationStrategy {
    protected abstract getHourlyRate(): number;

    calculateFee(entryTime: Date, exitTime: Date): number {
        const diffMs = exitTime.getTime() - entryTime.getTime();
        const diffMins = diffMs / (1000 * 60);

        if (diffMins <= GRACE_PERIOD_MINUTES) {
            return 0; // Free within grace period
        }

        const hours = Math.ceil(diffMins / 60);
        return hours * this.getHourlyRate();
    }
}

export class MotorcycleFeeStrategy extends BaseFeeStrategy {
    protected getHourlyRate(): number {
        return 10;
    }
}

export class CarFeeStrategy extends BaseFeeStrategy {
    protected getHourlyRate(): number {
        return 20;
    }
}

export class BusFeeStrategy extends BaseFeeStrategy {
    protected getHourlyRate(): number {
        return 50;
    }
}

export class FeeStrategyFactory {
    static getStrategy(vehicleType: string): FeeCalculationStrategy {
        switch (vehicleType) {
            case 'MOTORCYCLE': return new MotorcycleFeeStrategy();
            case 'CAR': return new CarFeeStrategy();
            case 'BUS': return new BusFeeStrategy();
            default: throw new Error(`Unknown vehicle type: ${vehicleType}`);
        }
    }
}
