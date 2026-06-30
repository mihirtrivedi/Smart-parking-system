import { FeeStrategyFactory } from '../src/strategies/FeeCalculationStrategy';

describe('Fee Calculation Strategy', () => {
    it('should calculate $0 fee for grace period (10 minutes)', () => {
        const strategy = FeeStrategyFactory.getStrategy('CAR');
        const entry = new Date('2024-05-20T10:00:00Z');
        const exit = new Date('2024-05-20T10:10:00Z');
        expect(strategy.calculateFee(entry, exit)).toBe(0);
    });

    it('should calculate correct fee for Motorcycle (1 hour)', () => {
        const strategy = FeeStrategyFactory.getStrategy('MOTORCYCLE');
        const entry = new Date('2024-05-20T10:00:00Z');
        const exit = new Date('2024-05-20T11:00:00Z');
        expect(strategy.calculateFee(entry, exit)).toBe(10); // $10/hr
    });

    it('should correctly round up hours for Car (61 minutes)', () => {
        const strategy = FeeStrategyFactory.getStrategy('CAR');
        const entry = new Date('2024-05-20T10:00:00Z');
        const exit = new Date('2024-05-20T11:01:00Z');
        expect(strategy.calculateFee(entry, exit)).toBe(40); // 2 hours * $20/hr
    });

    it('should correctly calculate fee for Bus (3 hours)', () => {
        const strategy = FeeStrategyFactory.getStrategy('BUS');
        const entry = new Date('2024-05-20T10:00:00Z');
        const exit = new Date('2024-05-20T13:00:00Z');
        expect(strategy.calculateFee(entry, exit)).toBe(150); // 3 hours * $50/hr
    });
});
