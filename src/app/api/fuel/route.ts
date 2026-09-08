import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get("vehicleId");
    const requestedLimit = Number(searchParams.get("limit") || 200);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.floor(requestedLimit), 1), 500)
      : 200;

    const where: any = {
      vehicle: {
        userId: session.userId,
      },
    };
    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    const logs = await db.fuelLog.findMany({
      where,
      include: {
        vehicle: {
          select: { id: true, name: true, make: true, model: true, year: true, fuelType: true, mileage: true },
        },
      },
      orderBy: { logDate: "desc" },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching fuel logs:", error);
    return NextResponse.json({ error: "Failed to fetch fuel logs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { vehicleId, logDate, mileage, units, pricePerUnit, notes } = body;

    if (!vehicleId || mileage === undefined || units === undefined || pricePerUnit === undefined) {
      return NextResponse.json(
        { error: "vehicleId, mileage, units, and pricePerUnit are required" },
        { status: 400 }
      );
    }

    // Verify vehicle belongs to user
    const vehicle = await db.vehicle.findFirst({
      where: { id: vehicleId, userId: session.userId },
    });
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const currentOdo = Number(mileage);
    const fuelUnits = Number(units);
    const unitPrice = Number(pricePerUnit);
    if (!Number.isFinite(currentOdo) || currentOdo < 0 || !Number.isFinite(fuelUnits) || fuelUnits <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
      return NextResponse.json({ error: "Mileage, units, and price must be valid positive values" }, { status: 400 });
    }
    const totalCost = fuelUnits * unitPrice;

    // Find previous fuel log to calculate MPG / efficiency
    const lastLog = await db.fuelLog.findFirst({
      where: { vehicleId, mileage: { lt: currentOdo } },
      orderBy: { mileage: "desc" },
    });

    let calculatedMpg: number | null = null;
    if (lastLog && fuelUnits > 0) {
      const distance = currentOdo - lastLog.mileage;
      if (distance > 0) {
        calculatedMpg = parseFloat((distance / fuelUnits).toFixed(1));
      }
    }

    const log = await db.fuelLog.create({
      data: {
        vehicleId,
        logDate: logDate ? new Date(logDate) : new Date(),
        mileage: currentOdo,
        units: fuelUnits,
        pricePerUnit: unitPrice,
        totalCost: parseFloat(totalCost.toFixed(2)),
        calculatedMpg,
        notes: notes || null,
      },
    });

    // Update vehicle mileage if higher
    if (currentOdo > vehicle.mileage) {
      await db.vehicle.update({
        where: { id: vehicleId },
        data: { mileage: currentOdo },
      });
    }

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Error creating fuel log:", error);
    return NextResponse.json({ error: "Failed to create fuel log" }, { status: 500 });
  }
}
