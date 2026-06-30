import { PrismaClient } from '@prisma/client'
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clear existing data (for idempotency)
  await prisma.ticket.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.parkingSpot.deleteMany()

  // Read from lot-layout config instead of hardcoding
  const layoutPath = path.join(__dirname, 'lot-layout.json');
  const layout = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));

  const floors = layout.floors;
  const spotsPerFloor = layout.spotsPerFloor; 

  for (let floor = 1; floor <= floors; floor++) {
    let currentSpot = 1;

    for (const [spotType, count] of Object.entries(layout.distribution)) {
        for (let i = 0; i < Number(count); i++) {
            await prisma.parkingSpot.create({
              data: {
                floorNumber: floor,
                spotNumber: currentSpot++,
                spotType: spotType,
                status: 'AVAILABLE'
              }
            });
        }
    }
  }

  console.log(`Database seeded with ${floors * spotsPerFloor} parking spots.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
