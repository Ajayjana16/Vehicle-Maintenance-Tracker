import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { calculateVehicleHealthScore } from "@/lib/health-calculator";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get("vehicleId");
    const serviceType = searchParams.get("serviceType");

    const where: any = {
      vehicle: { userId: session.userId },
    };
    if (vehicleId) where.vehicleId = vehicleId;
    if (serviceType && serviceType !== "ALL") where.serviceType = serviceType;

    const records = await db.maintenanceRecord.findMany({
      where,
      include: {
        vehicle: {
          select: { id: true, name: true, make: true, model: true, year: true },
        },
      },
      orderBy: { serviceDate: "desc" },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching maintenance records:", error);
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
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
      vehicleId,
      title,
      serviceType,
      serviceDate,
      mileage,
      cost,
      provider,
      notes,
      receiptText,
    } = body;

    if (!vehicleId || !title || !serviceDate || mileage === undefined || cost === undefined) {
      return NextResponse.json(
        { error: "Vehicle, title, service date, mileage, and cost are required." },
        { status: 400 }
      );
    }
    const numericMileage = Number(mileage);
    const numericCost = Number(cost);
    if (!Number.isFinite(numericMileage) || numericMileage < 0 || !Number.isFinite(numericCost) || numericCost < 0 || Number.isNaN(new Date(serviceDate).getTime())) {
      return NextResponse.json({ error: "Please provide a valid service date, mileage, and cost." }, { status: 400 });
    }

    const vehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
      include: { schedules: true, diagnostics: true },
    });

    if (!vehicle || vehicle.userId !== session.userId) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const record = await db.maintenanceRecord.create({
      data: {
        vehicleId,
        title: title.trim(),
        serviceType: serviceType || "GENERAL",
        serviceDate: new Date(serviceDate),
        mileage: numericMileage,
        cost: numericCost,
        provider: (provider || "Self-Serviced").trim(),
        notes: notes ? notes.trim() : null,
        receiptText: receiptText || null,
      },
    });

    // If recorded mileage is greater than current vehicle mileage, update vehicle
    if (numericMileage > vehicle.mileage) {
      await db.vehicle.update({
        where: { id: vehicleId },
        data: { mileage: numericMileage },
      });
    }

    // Reset matching schedule items if applicable
    for (const schedule of vehicle.schedules) {
      if (
        schedule.taskName.toLowerCase().includes(title.toLowerCase()) ||
        title.toLowerCase().includes(schedule.taskName.toLowerCase()) ||
        (serviceType === "OIL_CHANGE" && schedule.category === "ENGINE") ||
        (serviceType === "TIRES" && schedule.category === "TIRES") ||
        (serviceType === "BRAKES" && schedule.category === "BRAKES") ||
        (serviceType === "FILTERS" && schedule.category === "FILTERS")
      ) {
        const nextMiles = numericMileage + schedule.intervalMiles;
        const nextDate = new Date(Date.now() + schedule.intervalMonths * 30 * 24 * 60 * 60 * 1000);
        await db.maintenanceScheduleItem.update({
          where: { id: schedule.id },
          data: {
            lastServicedMileage: numericMileage,
            lastServicedDate: new Date(serviceDate),
            nextDueMileage: nextMiles,
            nextDueDate: nextDate,
            urgency: "GOOD",
          },
        });
      }
    }

    // Recalculate health score
    const refetched = await db.vehicle.findUnique({
      where: { id: vehicleId },
      include: { schedules: true, diagnostics: true },
    });
    if (refetched) {
      const newScore = calculateVehicleHealthScore(
        refetched.mileage,
        refetched.year,
        refetched.schedules,
        refetched.diagnostics
      );
      await db.vehicle.update({
        where: { id: vehicleId },
        data: { healthScore: newScore },
      });
    }

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Error creating maintenance record:", error);
    return NextResponse.json({ error: "Failed to create maintenance record" }, { status: 500 });
  }
}
