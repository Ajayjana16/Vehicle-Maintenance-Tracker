import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with personal vehicle owners & their vehicles...");

  // Clean existing tables
  await prisma.notification.deleteMany();
  await prisma.vehicleDocument.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.diagnosticScan.deleteMany();
  await prisma.maintenanceScheduleItem.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // 1. Password Hash (Password: Password123!)
  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 2. Personal Users
  const alexUser = await prisma.user.create({
    data: {
      email: "alex@autopulse.me",
      name: "Alex Mercer",
      firstName: "Alex",
      lastName: "Mercer",
      passwordHash,
      emailVerified: true,
    },
  });

  const sarahUser = await prisma.user.create({
    data: {
      email: "sarah@autopulse.me",
      name: "Sarah Chen",
      firstName: "Sarah",
      lastName: "Chen",
      passwordHash,
      emailVerified: true,
    },
  });

  const marcusUser = await prisma.user.create({
    data: {
      email: "marcus@autopulse.me",
      name: "Marcus Vance",
      firstName: "Marcus",
      lastName: "Vance",
      passwordHash,
      emailVerified: true,
    },
  });

  // 3. Alex's Vehicles
  // 3a. 2023 Tesla Model 3 Long Range
  const tesla = await prisma.vehicle.create({
    data: {
      userId: alexUser.id,
      nickname: "Commuter EV",
      name: "2023 Tesla Model 3 Long Range",
      make: "Tesla",
      model: "Model 3",
      year: 2023,
      trim: "Long Range Dual Motor AWD",
      vin: "5YJ3E1EB2PF819302",
      licensePlate: "EV9021",
      mileage: 24100,
      avgDailyMiles: 30,
      fuelType: "ELECTRIC",
      transmission: "DIRECT_DRIVE",
      imageUrl: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=60",
      healthScore: 92,
      obdConnected: true,
      lastObdSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      schedules: {
        create: [
          {
            taskName: "Brake Fluid Moisture Inspection & Desiccant Check",
            category: "BRAKES",
            intervalMiles: 25000,
            intervalMonths: 24,
            lastServicedMileage: 0,
            lastServicedDate: new Date("2023-09-01"),
            nextDueMileage: 25000,
            nextDueDate: new Date("2026-09-30"),
            urgency: "DUE_SOON",
            estimatedCost: 110,
          },
          {
            taskName: "Cabin Air Filter & HEPA Replacement",
            category: "FILTERS",
            intervalMiles: 20000,
            intervalMonths: 24,
            lastServicedMileage: 0,
            lastServicedDate: new Date("2023-09-01"),
            nextDueMileage: 25000,
            nextDueDate: new Date("2026-10-15"),
            urgency: "DUE_SOON",
            estimatedCost: 75,
          },
          {
            taskName: "AC Desiccant Bag Replacement",
            category: "OTHER",
            intervalMiles: 50000,
            intervalMonths: 48,
            lastServicedMileage: 0,
            lastServicedDate: new Date("2023-09-01"),
            nextDueMileage: 50000,
            nextDueDate: new Date("2027-09-01"),
            urgency: "GOOD",
            estimatedCost: 190,
          },
        ],
      },
      maintenanceRecords: {
        create: [
          {
            title: "Tire Rotation & High-Speed Dynamic Balance",
            serviceType: "TIRES",
            serviceDate: new Date("2026-02-14"),
            mileage: 18500,
            cost: 50.0,
            provider: "Tesla Mobile Service",
            notes: "Ranger performed rotation in home driveway. Tread depth 6/32 across all four Michelin tires.",
          },
          {
            title: "Wiper Blade Replacement & Washer Fluid",
            serviceType: "GENERAL",
            serviceDate: new Date("2025-10-10"),
            mileage: 12000,
            cost: 42.0,
            provider: "DIY / Self-Serviced",
            notes: "OEM Tesla blade set.",
          },
        ],
      },
      fuelLogs: {
        create: [
          {
            logDate: new Date("2026-09-04"),
            mileage: 24100,
            units: 52.0, // kWh
            pricePerUnit: 0.16, // $/kWh
            totalCost: 8.32,
            calculatedMpg: 128.0, // MPGe
            notes: "Home Level 2 Wall Connector (240V / 48A).",
          },
          {
            logDate: new Date("2026-08-20"),
            mileage: 23820,
            units: 54.5,
            pricePerUnit: 0.38,
            totalCost: 20.71,
            calculatedMpg: 122.0,
            notes: "Tesla Supercharger 250kW V3.",
          },
        ],
      },
      documents: {
        create: [
          {
            docType: "WARRANTY",
            provider: "Tesla New Vehicle Limited Warranty",
            policyNumber: "TSLA-BATTERY-8YR",
            expiryDate: new Date("2031-09-15"),
            notes: "Battery & Drive Unit 8 Years or 120,000 miles (minimum 70% retention).",
          },
        ],
      },
    },
  });

  // 3b. 2021 Toyota RAV4 Hybrid
  const rav4 = await prisma.vehicle.create({
    data: {
      userId: alexUser.id,
      nickname: "Family Daily Driver",
      name: "2021 Toyota RAV4 Hybrid XSE",
      make: "Toyota",
      model: "RAV4 Hybrid",
      year: 2021,
      trim: "XSE AWD",
      vin: "4T3RWRFV3MU189201",
      licensePlate: "7XYZ942",
      mileage: 48250,
      avgDailyMiles: 38,
      fuelType: "HYBRID",
      transmission: "CVT",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Toyota_RAV4_Hybrid_CRI_04_2021_8338.jpg/1280px-Toyota_RAV4_Hybrid_CRI_04_2021_8338.jpg",
      healthScore: 88,
      obdConnected: true,
      lastObdSyncAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      schedules: {
        create: [
          {
            taskName: "Synthetic Engine Oil & Filter (0W-16)",
            category: "ENGINE",
            intervalMiles: 10000,
            intervalMonths: 12,
            lastServicedMileage: 40100,
            lastServicedDate: new Date("2026-03-10"),
            nextDueMileage: 50100,
            nextDueDate: new Date("2027-03-10"),
            urgency: "GOOD",
            estimatedCost: 85,
          },
          {
            taskName: "Tire Rotation & Tread Depth Inspection",
            category: "TIRES",
            intervalMiles: 5000,
            intervalMonths: 6,
            lastServicedMileage: 43500,
            lastServicedDate: new Date("2026-06-15"),
            nextDueMileage: 48500,
            nextDueDate: new Date("2026-10-15"),
            urgency: "DUE_SOON",
            estimatedCost: 35,
          },
          {
            taskName: "Cabin & Engine Air Filters",
            category: "FILTERS",
            intervalMiles: 15000,
            intervalMonths: 12,
            lastServicedMileage: 30000,
            lastServicedDate: new Date("2025-08-20"),
            nextDueMileage: 45000,
            nextDueDate: new Date("2026-08-20"),
            urgency: "OVERDUE",
            estimatedCost: 60,
          },
        ],
      },
      maintenanceRecords: {
        create: [
          {
            title: "40,000-Mile Factory Major Service",
            serviceType: "OIL_CHANGE",
            serviceDate: new Date("2026-03-10"),
            mileage: 40100,
            cost: 175.5,
            provider: "Toyota of Sunnyvale",
            notes: "Replaced 0W-16 full synthetic oil, oil filter, multipoint inspection.",
          },
          {
            title: "Front Ceramic Brake Pads Replacement",
            serviceType: "BRAKES",
            serviceDate: new Date("2025-11-04"),
            mileage: 35200,
            cost: 290.0,
            provider: "Firestone Complete Auto Care",
            notes: "Replaced front ceramic pads; rear pads at 6mm remaining.",
          },
        ],
      },
      fuelLogs: {
        create: [
          {
            logDate: new Date("2026-08-28"),
            mileage: 48250,
            units: 11.2,
            pricePerUnit: 3.85,
            totalCost: 43.12,
            calculatedMpg: 41.8,
            notes: "Commute & weekend trip.",
          },
          {
            logDate: new Date("2026-08-14"),
            mileage: 47780,
            units: 11.5,
            pricePerUnit: 3.89,
            totalCost: 44.74,
            calculatedMpg: 40.5,
            notes: "Regular 87 octane.",
          },
        ],
      },
      diagnostics: {
        create: [
          {
            codes: "P0442",
            symptoms: "Check engine light illuminated after fueling; no abnormal driving sensation.",
            severity: "MINOR",
            canDrive: true,
            aiSummary: "Small EVAP emission control leak. Gas cap was improperly torqued.",
            possibleCauses: JSON.stringify(["Loose gas cap", "Worn rubber gas cap O-ring"]),
            diySteps: JSON.stringify(["Re-tightened gas cap with 3 clicks", "Code cleared and resolved"]),
            estimatedCostMin: 15,
            estimatedCostMax: 40,
            status: "RESOLVED",
            dataSource: "OBD_II",
            scanDate: new Date("2026-05-12"),
          },
        ],
      },
      documents: {
        create: [
          {
            docType: "INSURANCE",
            provider: "Geico Premium Auto",
            policyNumber: "POL-984218-A",
            expiryDate: new Date("2027-02-15"),
            notes: "$500 Deductible",
          },
        ],
      },
    },
  });

  // 3c. 2018 Ford F-150 Lariat SuperCrew
  const f150 = await prisma.vehicle.create({
    data: {
      userId: alexUser.id,
      nickname: "Hauler & Work Truck",
      name: "2018 Ford F-150 Lariat",
      make: "Ford",
      model: "F-150",
      year: 2018,
      trim: "Lariat SuperCrew 3.5L EcoBoost",
      vin: "1FTFW1E87JFC49182",
      licensePlate: "TRK8812",
      mileage: 92400,
      avgDailyMiles: 45,
      fuelType: "GASOLINE",
      transmission: "AUTOMATIC",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/2018_Ford_F-150_Crew_Cab_front_5.26.18.jpg/1280px-2018_Ford_F-150_Crew_Cab_front_5.26.18.jpg",
      healthScore: 68,
      obdConnected: true,
      lastObdSyncAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      schedules: {
        create: [
          {
            taskName: "10-Speed Transmission Fluid & Filter Flush",
            category: "FLUIDS",
            intervalMiles: 30000,
            intervalMonths: 36,
            lastServicedMileage: 60000,
            lastServicedDate: new Date("2024-02-15"),
            nextDueMileage: 90000,
            nextDueDate: new Date("2026-07-01"),
            urgency: "OVERDUE",
            estimatedCost: 320,
          },
          {
            taskName: "Engine Oil & Motorcraft Filter (5W-30)",
            category: "ENGINE",
            intervalMiles: 6000,
            intervalMonths: 6,
            lastServicedMileage: 87000,
            lastServicedDate: new Date("2026-04-18"),
            nextDueMileage: 93000,
            nextDueDate: new Date("2026-10-18"),
            urgency: "DUE_SOON",
            estimatedCost: 95,
          },
        ],
      },
      diagnostics: {
        create: [
          {
            codes: "P0420",
            symptoms: "Check Engine Light on. Mild decrease in highway passing power and slight sulfur exhaust odor.",
            severity: "MODERATE",
            canDrive: true,
            aiSummary: "Catalytic Converter System Efficiency Below Threshold (Bank 1). Safe for short city drives, but prompt attention advised before emissions inspection.",
            possibleCauses: JSON.stringify([
              "Degraded Bank 1 catalytic converter catalyst matrix",
              "Faulty downstream O2 Oxygen Sensor (Bank 1 Sensor 2)",
              "Exhaust flange gasket pinhole leak upstream of converter",
            ]),
            diySteps: JSON.stringify([
              "Test downstream O2 sensor live voltage waveform via OBD-II PID",
              "Check exhaust pipes for rust holes or loose heat shields",
              "Run CataClean exhaust system cleaner prior to replacing converter",
            ]),
            estimatedCostMin: 180,
            estimatedCostMax: 1250,
            status: "ACTIVE",
            dataSource: "OBD_II",
            scanDate: new Date("2026-09-01"),
          },
        ],
      },
      maintenanceRecords: {
        create: [
          {
            title: "Rear Differential Fluid & Brake Bleed",
            serviceType: "FLUIDS",
            serviceDate: new Date("2026-01-12"),
            mileage: 85200,
            cost: 210.0,
            provider: "Northside 4x4 Offroad Specialists",
            notes: "75W-140 synthetic gear oil replaced.",
          },
        ],
      },
      fuelLogs: {
        create: [
          {
            logDate: new Date("2026-09-02"),
            mileage: 92400,
            units: 24.5,
            pricePerUnit: 3.79,
            totalCost: 92.85,
            calculatedMpg: 17.2,
            notes: "Towing trailer.",
          },
        ],
      },
      documents: {
        create: [
          {
            docType: "INSURANCE",
            provider: "State Farm Personal Auto",
            policyNumber: "SF-8832-TRK",
            expiryDate: new Date("2027-05-30"),
            notes: "Includes Roadside Assistance.",
          },
        ],
      },
    },
  });

  // 4. Sarah's Vehicles
  await prisma.vehicle.create({
    data: {
      userId: sarahUser.id,
      nickname: "Electric Truck",
      name: "2022 Ford F-150 Lightning",
      make: "Ford",
      model: "F-150 Lightning",
      year: 2022,
      trim: "Lariat Extended Range AWD",
      vin: "1FT6W1EV6NW018294",
      licensePlate: "LTN-9482",
      mileage: 34200,
      avgDailyMiles: 36,
      fuelType: "ELECTRIC",
      transmission: "DIRECT_DRIVE",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/2022_Ford_F-150_Lightning.jpg/1280px-2022_Ford_F-150_Lightning.jpg",
      healthScore: 94,
      obdConnected: true,
      lastObdSyncAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      schedules: {
        create: [
          {
            taskName: "Tire Rotation & Tread Inspection",
            category: "TIRES",
            intervalMiles: 7500,
            intervalMonths: 6,
            lastServicedMileage: 30000,
            lastServicedDate: new Date("2026-05-10"),
            nextDueMileage: 37500,
            nextDueDate: new Date("2026-11-10"),
            urgency: "GOOD",
            estimatedCost: 35,
          },
        ],
      },
      fuelLogs: {
        create: [
          {
            logDate: new Date("2026-09-03"),
            mileage: 34200,
            units: 78.0,
            pricePerUnit: 0.18,
            totalCost: 14.04,
            calculatedMpg: 70.0,
            notes: "Home charging.",
          },
        ],
      },
    },
  });

  await prisma.vehicle.create({
    data: {
      userId: sarahUser.id,
      nickname: "Daily EV",
      name: "2024 Hyundai Ioniq 5 Limited",
      make: "Hyundai",
      model: "Ioniq 5",
      year: 2024,
      trim: "Limited AWD",
      vin: "KM8KN4AE4RU092841",
      licensePlate: "IQ5-2024",
      mileage: 8900,
      avgDailyMiles: 28,
      fuelType: "ELECTRIC",
      transmission: "DIRECT_DRIVE",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Hyundai_Ioniq_5_N_IMG_0053.jpg/1280px-Hyundai_Ioniq_5_N_IMG_0053.jpg",
      healthScore: 100,
      obdConnected: true,
      lastObdSyncAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      schedules: {
        create: [
          {
            taskName: "Cabin Air Filter",
            category: "FILTERS",
            intervalMiles: 15000,
            intervalMonths: 12,
            lastServicedMileage: 0,
            lastServicedDate: new Date("2024-01-15"),
            nextDueMileage: 15000,
            nextDueDate: new Date("2027-01-15"),
            urgency: "GOOD",
            estimatedCost: 45,
          },
        ],
      },
    },
  });

  // 5. Marcus's Vehicles
  await prisma.vehicle.create({
    data: {
      userId: marcusUser.id,
      nickname: "City Commuter",
      name: "2020 Honda Civic Sport",
      make: "Honda",
      model: "Civic",
      year: 2020,
      trim: "Sport Touring Hatchback 1.5T",
      vin: "SHHFK7H54LU201948",
      licensePlate: "CV-4210",
      mileage: 42100,
      avgDailyMiles: 32,
      fuelType: "GASOLINE",
      transmission: "CVT",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Honda_Civic_Hatchback_%28FK4%29.jpg/1280px-Honda_Civic_Hatchback_%28FK4%29.jpg",
      healthScore: 92,
      obdConnected: true,
      lastObdSyncAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      schedules: {
        create: [
          {
            taskName: "Synthetic Engine Oil (0W-20) & Filter",
            category: "ENGINE",
            intervalMiles: 7500,
            intervalMonths: 12,
            lastServicedMileage: 37500,
            lastServicedDate: new Date("2026-03-01"),
            nextDueMileage: 45000,
            nextDueDate: new Date("2027-03-01"),
            urgency: "GOOD",
            estimatedCost: 75,
          },
        ],
      },
    },
  });

  await prisma.vehicle.create({
    data: {
      userId: marcusUser.id,
      nickname: "Weekend Sedan",
      name: "2019 BMW 330i xDrive",
      make: "BMW",
      model: "330i",
      year: 2019,
      trim: "xDrive M Sport",
      vin: "WBA5R7C58KFH94821",
      licensePlate: "BMW-330",
      mileage: 51300,
      avgDailyMiles: 25,
      fuelType: "GASOLINE",
      transmission: "AUTOMATIC",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/BMW_330i_M_Sport_%28G20%29_%28Singapore%29.jpg/1280px-BMW_330i_M_Sport_%28G20%29_%28Singapore%29.jpg",
      healthScore: 86,
      obdConnected: false,
      lastObdSyncAt: null,
      schedules: {
        create: [
          {
            taskName: "Brake Fluid Flush",
            category: "BRAKES",
            intervalMiles: 30000,
            intervalMonths: 24,
            lastServicedMileage: 30000,
            lastServicedDate: new Date("2024-05-15"),
            nextDueMileage: 60000,
            nextDueDate: new Date("2026-05-15"),
            urgency: "OVERDUE",
            estimatedCost: 160,
          },
        ],
      },
    },
  });

  console.log(`Successfully seeded personal vehicle owners & vehicles:`);
  console.log(`- Alex Mercer (${alexUser.email}): Tesla Model 3, RAV4 Hybrid, Ford F-150`);
  console.log(`- Sarah Chen (${sarahUser.email}): F-150 Lightning, Ioniq 5`);
  console.log(`- Marcus Vance (${marcusUser.email}): Civic Sport, BMW 330i`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
