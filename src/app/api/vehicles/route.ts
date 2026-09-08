import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { calculateVehicleHealthScore } from "@/lib/health-calculator";
import { resolveVehicleImage, isValidImageUrl } from "@/lib/vehicle-image";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const fuelType = searchParams.get("fuelType") || undefined;
    const vehicleType = searchParams.get("vehicleType") || undefined;
    const isSummary = searchParams.get("summary") === "true";

    // Strict user isolation
    const where: any = { userId: session.userId };
    if (fuelType && fuelType !== "ALL") where.fuelType = fuelType;
    if (vehicleType && vehicleType !== "ALL") where.vehicleType = vehicleType;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nickname: { contains: search } },
        { make: { contains: search } },
        { model: { contains: search } },
        { vin: { contains: search } },
        { licensePlate: { contains: search } },
      ];
    }

    // 1. Fast path for vehicle summary lookups (used across sidebar, selectors, and background caching)
    if (isSummary) {
      const summaries = await db.vehicle.findMany({
        where,
        select: {
          id: true,
          userId: true,
          nickname: true,
          name: true,
          make: true,
          model: true,
          year: true,
          trim: true,
          vin: true,
          licensePlate: true,
          mileage: true,
          avgDailyMiles: true,
          vehicleType: true,
          fuelType: true,
          transmission: true,
          engineCc: true,
          driveType: true,
          coolingType: true,
          purchaseDate: true,
          imageUrl: true,
          healthScore: true,
          obdConnected: true,
          lastObdSyncAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(summaries);
    }

    // 2. Optimized path for vehicle list (loads only essential schedule & diagnostic status, excludes heavy history)
    const vehicles = await db.vehicle.findMany({
      where,
      select: {
        id: true,
        userId: true,
        nickname: true,
        name: true,
        make: true,
        model: true,
        year: true,
        trim: true,
        vin: true,
        licensePlate: true,
        mileage: true,
        avgDailyMiles: true,
        vehicleType: true,
        fuelType: true,
        transmission: true,
        engineCc: true,
        driveType: true,
        coolingType: true,
        purchaseDate: true,
        imageUrl: true,
        healthScore: true,
        obdConnected: true,
        lastObdSyncAt: true,
        lastPingAt: true,
        createdAt: true,
        updatedAt: true,
        schedules: {
          select: {
            id: true,
            taskName: true,
            category: true,
            urgency: true,
            nextDueMileage: true,
            nextDueDate: true,
            estimatedCost: true,
          },
          orderBy: { nextDueDate: "asc" },
        },
        diagnostics: {
          select: {
            id: true,
            codes: true,
            status: true,
            severity: true,
            aiSummary: true,
            scanDate: true,
          },
          orderBy: { scanDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Dynamically calculate health score
    const enriched = vehicles.map((v) => {
      const score = calculateVehicleHealthScore(v.mileage, v.year, v.schedules, v.diagnostics);
      return {
        ...v,
        healthScore: score,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching personal vehicles:", error);
    return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      nickname,
      make,
      model,
      year,
      trim,
      vehicleType,
      vin,
      licensePlate,
      mileage,
      avgDailyMiles,
      fuelType,
      transmission,
      engineCc,
      driveType,
      coolingType,
      purchaseDate,
      imageUrl,
    } = body;

    if (
      typeof make !== "string" ||
      typeof model !== "string" ||
      !make.trim() ||
      !model.trim() ||
      year === undefined ||
      mileage === undefined
    ) {
      return NextResponse.json(
        { error: "Make, model, year, and mileage are required." },
        { status: 400 }
      );
    }

    const numericYear = Number(year);
    const currentMileage = Number(mileage);
    if (!Number.isInteger(numericYear) || numericYear < 1900 || numericYear > new Date().getFullYear() + 1) {
      return NextResponse.json({ error: "Please provide a valid vehicle year." }, { status: 400 });
    }
    if (!Number.isFinite(currentMileage) || currentMileage < 0) {
      return NextResponse.json({ error: "Please provide a valid odometer reading." }, { status: 400 });
    }

    const cleanMake = make.trim();
    const cleanModel = model.trim();
    const cleanTrim = typeof trim === "string" ? trim.trim() : null;
    const cleanType = (vehicleType || "CAR").toUpperCase();
    const cleanFuel = (fuelType || "GASOLINE").toUpperCase();
    const cleanTrans = (
      transmission ||
      (cleanType === "SCOOTER" ? "CVT" : cleanFuel === "ELECTRIC" ? "DIRECT_DRIVE" : "AUTOMATIC")
    ).toUpperCase();

    const isEV = cleanFuel === "ELECTRIC";
    const isHybrid = cleanFuel === "HYBRID";
    const isMotorcycle = cleanType === "MOTORCYCLE";
    const isScooter = cleanType === "SCOOTER";

    const resolvedName = (name || `${numericYear} ${cleanMake} ${cleanModel} ${cleanTrim || ""}`).trim();

    const providedImageUrl = typeof imageUrl === "string" ? imageUrl.trim() : "";
    let finalImageUrl: string | null = null;
    if (providedImageUrl) {
      if (!isValidImageUrl(providedImageUrl)) {
        return NextResponse.json(
          { error: "Invalid vehicle image URL. Please provide a valid http:// or https:// URL." },
          { status: 400 }
        );
      }
      finalImageUrl = providedImageUrl;
    } else {
      finalImageUrl = (await resolveVehicleImage({
        year: numericYear,
        make: cleanMake,
        model: cleanModel,
        trim: cleanTrim,
        vehicleType: cleanType,
        fuelType: cleanFuel,
      })) || null;
    }

    // Generate vehicle-type-tailored initial maintenance schedules
    const defaultSchedules = [];

    if (isMotorcycle) {
      // Motorcycle factory intervals
      if (!isEV) {
        defaultSchedules.push({
          taskName: "Engine Oil & Filter Replacement (10W-40 / 15W-50)",
          category: "ENGINE",
          intervalMiles: 3500,
          intervalMonths: 6,
          lastServicedMileage: currentMileage,
          lastServicedDate: new Date(),
          nextDueMileage: currentMileage + 3500,
          nextDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          urgency: "GOOD",
          estimatedCost: 45,
        });
        defaultSchedules.push({
          taskName: "Spark Plug Gap Inspection / Replacement",
          category: "ELECTRICAL",
          intervalMiles: 7500,
          intervalMonths: 12,
          lastServicedMileage: currentMileage,
          lastServicedDate: new Date(),
          nextDueMileage: currentMileage + 7500,
          nextDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          urgency: "GOOD",
          estimatedCost: 25,
        });
      }

      defaultSchedules.push({
        taskName: "Drive Chain Cleaning, Lubrication & Slack Check",
        category: "DRIVE",
        intervalMiles: 600,
        intervalMonths: 1,
        lastServicedMileage: currentMileage,
        lastServicedDate: new Date(),
        nextDueMileage: currentMileage + 600,
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        urgency: "GOOD",
        estimatedCost: 15,
      });

      defaultSchedules.push({
        taskName: "Brake Fluid & Pad Wear Inspection",
        category: "BRAKES",
        intervalMiles: 6000,
        intervalMonths: 12,
        lastServicedMileage: currentMileage,
        lastServicedDate: new Date(),
        nextDueMileage: currentMileage + 6000,
        nextDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        urgency: "GOOD",
        estimatedCost: 35,
      });

      defaultSchedules.push({
        taskName: "Motorcycle Tire Pressure & Tread Depth",
        category: "TIRES",
        intervalMiles: 1500,
        intervalMonths: 2,
        lastServicedMileage: currentMileage,
        lastServicedDate: new Date(),
        nextDueMileage: currentMileage + 1500,
        nextDueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        urgency: "GOOD",
        estimatedCost: 0,
      });

      defaultSchedules.push({
        taskName: "Front Fork Seal & Rear Shock Inspection",
        category: "SUSPENSION",
        intervalMiles: 10000,
        intervalMonths: 12,
        lastServicedMileage: currentMileage,
        lastServicedDate: new Date(),
        nextDueMileage: currentMileage + 10000,
        nextDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        urgency: "GOOD",
        estimatedCost: 65,
      });
    } else if (isScooter) {
      // Scooter factory intervals
      if (!isEV) {
        defaultSchedules.push({
          taskName: "Scooter Engine Oil Change (10W-30 MB Spec)",
          category: "ENGINE",
          intervalMiles: 3000,
          intervalMonths: 6,
          lastServicedMileage: currentMileage,
          lastServicedDate: new Date(),
          nextDueMileage: currentMileage + 3000,
          nextDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          urgency: "GOOD",
          estimatedCost: 25,
        });
        defaultSchedules.push({
          taskName: "Final Drive / Transmission Gear Oil Change",
          category: "DRIVE",
          intervalMiles: 6000,
          intervalMonths: 12,
          lastServicedMileage: currentMileage,
          lastServicedDate: new Date(),
          nextDueMileage: currentMileage + 6000,
          nextDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          urgency: "GOOD",
          estimatedCost: 20,
        });
        defaultSchedules.push({
          taskName: "CVT Drive Belt & Variator Roller Inspection",
          category: "DRIVE",
          intervalMiles: 10000,
          intervalMonths: 18,
          lastServicedMileage: currentMileage,
          lastServicedDate: new Date(),
          nextDueMileage: currentMileage + 10000,
          nextDueDate: new Date(Date.now() + 540 * 24 * 60 * 60 * 1000),
          urgency: "GOOD",
          estimatedCost: 55,
        });
      }

      defaultSchedules.push({
        taskName: "Brake Cables / Shoes / Disc Inspection & Play Adjustment",
        category: "BRAKES",
        intervalMiles: 3000,
        intervalMonths: 6,
        lastServicedMileage: currentMileage,
        lastServicedDate: new Date(),
        nextDueMileage: currentMileage + 3000,
        nextDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        urgency: "GOOD",
        estimatedCost: 25,
      });

      defaultSchedules.push({
        taskName: "Scooter Tire Pressure & Bead Inspection",
        category: "TIRES",
        intervalMiles: 1500,
        intervalMonths: 2,
        lastServicedMileage: currentMileage,
        lastServicedDate: new Date(),
        nextDueMileage: currentMileage + 1500,
        nextDueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        urgency: "GOOD",
        estimatedCost: 0,
      });
    } else {
      // Cars, SUVs, Vans, and EVs
      if (!isEV) {
        defaultSchedules.push({
          taskName: isHybrid
            ? "Synthetic Engine Oil & Filter (0W-16/0W-20)"
            : "Full Synthetic Motor Oil & Filter (5W-30)",
          category: "ENGINE",
          intervalMiles: isHybrid ? 10000 : 7500,
          intervalMonths: 12,
          lastServicedMileage: currentMileage,
          lastServicedDate: new Date(),
          nextDueMileage: currentMileage + (isHybrid ? 10000 : 7500),
          nextDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          urgency: "GOOD",
          estimatedCost: 85,
        });
        defaultSchedules.push({
          taskName: "Engine Air Filter Replacement",
          category: "FILTERS",
          intervalMiles: 15000,
          intervalMonths: 12,
          lastServicedMileage: currentMileage,
          lastServicedDate: new Date(),
          nextDueMileage: currentMileage + 15000,
          nextDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          urgency: "GOOD",
          estimatedCost: 45,
        });
      } else {
        defaultSchedules.push({
          taskName: "High-Voltage Battery Diagnostic & Thermal Inspection",
          category: "ELECTRICAL",
          intervalMiles: 12000,
          intervalMonths: 12,
          lastServicedMileage: currentMileage,
          lastServicedDate: new Date(),
          nextDueMileage: currentMileage + 12000,
          nextDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          urgency: "GOOD",
          estimatedCost: 65,
        });
      }

      defaultSchedules.push({
        taskName: "Tire Rotation & Pressure Inspection",
        category: "TIRES",
        intervalMiles: 6000,
        intervalMonths: 6,
        lastServicedMileage: currentMileage,
        lastServicedDate: new Date(),
        nextDueMileage: currentMileage + 6000,
        nextDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        urgency: "GOOD",
        estimatedCost: 35,
      });

      defaultSchedules.push({
        taskName: "Brake Fluid Moisture Inspection & Pad Check",
        category: "BRAKES",
        intervalMiles: 20000,
        intervalMonths: 24,
        lastServicedMileage: currentMileage,
        lastServicedDate: new Date(),
        nextDueMileage: currentMileage + 20000,
        nextDueDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
        urgency: "GOOD",
        estimatedCost: 110,
      });
    }

    const created = await db.vehicle.create({
      data: {
        userId: session.userId,
        name: resolvedName,
        nickname: nickname?.trim() || null,
        make: cleanMake,
        model: cleanModel,
        year: numericYear,
        trim: cleanTrim,
        vehicleType: cleanType,
        vin: vin?.trim() || null,
        licensePlate: licensePlate?.trim() || null,
        mileage: currentMileage,
        avgDailyMiles: avgDailyMiles ? Number(avgDailyMiles) : (isMotorcycle || isScooter ? 15 : 30),
        fuelType: cleanFuel,
        transmission: cleanTrans,
        engineCc: engineCc ? Number(engineCc) : null,
        driveType: driveType?.trim() || (isMotorcycle ? "CHAIN" : isScooter ? "CVT" : null),
        coolingType: coolingType?.trim() || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        imageUrl: finalImageUrl,
        healthScore: 100,
        schedules: {
          create: defaultSchedules,
        },
      },
      include: {
        schedules: true,
        diagnostics: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating vehicle:", error);
    return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 });
  }
}
