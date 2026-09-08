import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { calculateVehicleHealthScore, calculateSubsystemBreakdown } from "@/lib/health-calculator";
import { resolveVehicleImage, isValidImageUrl } from "@/lib/vehicle-image";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const vehicle = await db.vehicle.findUnique({
      where: { id: params.id },
      include: {
        schedules: {
          orderBy: { nextDueDate: "asc" },
        },
        diagnostics: {
          orderBy: { scanDate: "desc" },
        },
        maintenanceRecords: {
          orderBy: { serviceDate: "desc" },
        },
        fuelLogs: {
          orderBy: { logDate: "desc" },
        },
        documents: {
          orderBy: { expiryDate: "asc" },
        },
      },
    });

    if (!vehicle || vehicle.userId !== session.userId) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const healthScore = calculateVehicleHealthScore(
      vehicle.mileage,
      vehicle.year,
      vehicle.schedules,
      vehicle.diagnostics
    );
    const subsystems = calculateSubsystemBreakdown(
      vehicle.mileage,
      vehicle.schedules,
      vehicle.diagnostics
    );

    return NextResponse.json({
      ...vehicle,
      healthScore,
      subsystems,
    });
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return NextResponse.json({ error: "Failed to fetch vehicle" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      obdConnected,
    } = body;

    const currentVehicle = await db.vehicle.findUnique({
      where: { id: params.id },
      include: { schedules: true, diagnostics: true },
    });

    if (!currentVehicle || currentVehicle.userId !== session.userId) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const updatedMileage = mileage !== undefined ? Number(mileage) : currentVehicle.mileage;
    const updatedDailyMiles = avgDailyMiles !== undefined ? Number(avgDailyMiles) : currentVehicle.avgDailyMiles;
    const cleanType = vehicleType !== undefined ? String(vehicleType).toUpperCase() : currentVehicle.vehicleType;
    const cleanFuel = fuelType !== undefined ? String(fuelType).toUpperCase() : currentVehicle.fuelType;

    // Check urgency on schedules if mileage increased
    if (updatedMileage !== currentVehicle.mileage) {
      for (const schedule of currentVehicle.schedules) {
        let newUrgency = schedule.urgency;
        if (updatedMileage >= schedule.nextDueMileage) {
          newUrgency = "OVERDUE";
        } else if (schedule.nextDueMileage - updatedMileage <= 1000) {
          newUrgency = "DUE_SOON";
        }
        if (newUrgency !== schedule.urgency) {
          await db.maintenanceScheduleItem.update({
            where: { id: schedule.id },
            data: { urgency: newUrgency },
          });
        }
      }
    }

    let finalImageUrl = currentVehicle.imageUrl;
    if (imageUrl !== undefined) {
      if (imageUrl && imageUrl.trim()) {
        const trimmedUrl = imageUrl.trim();
        if (!isValidImageUrl(trimmedUrl)) {
          return NextResponse.json(
            { error: "Invalid vehicle image URL. Please provide a valid http:// or https:// URL." },
            { status: 400 }
          );
        }
        finalImageUrl = trimmedUrl;
      } else {
        const resolved = await resolveVehicleImage({
          year: year ? Number(year) : currentVehicle.year,
          make: (make ?? currentVehicle.make).trim(),
          model: (model ?? currentVehicle.model).trim(),
          trim: trim !== undefined ? (trim ? String(trim).trim() : null) : currentVehicle.trim,
          vehicleType: cleanType,
          fuelType: cleanFuel,
        });
        finalImageUrl = resolved || null;
      }
    }

    const updated = await db.vehicle.update({
      where: { id: params.id },
      data: {
        name: name ?? currentVehicle.name,
        nickname: nickname !== undefined ? (nickname ? String(nickname).trim() : null) : currentVehicle.nickname,
        make: make ?? currentVehicle.make,
        model: model ?? currentVehicle.model,
        year: year ? Number(year) : currentVehicle.year,
        trim: trim !== undefined ? trim : currentVehicle.trim,
        vehicleType: cleanType,
        vin: vin !== undefined ? (vin ? String(vin).trim().toUpperCase() : null) : currentVehicle.vin,
        licensePlate: licensePlate !== undefined ? (licensePlate ? String(licensePlate).trim().toUpperCase() : null) : currentVehicle.licensePlate,
        mileage: updatedMileage,
        avgDailyMiles: updatedDailyMiles,
        fuelType: cleanFuel,
        transmission: transmission ?? currentVehicle.transmission,
        engineCc: engineCc !== undefined ? (engineCc ? Number(engineCc) : null) : currentVehicle.engineCc,
        driveType: driveType !== undefined ? (driveType ? String(driveType).trim() : null) : currentVehicle.driveType,
        coolingType: coolingType !== undefined ? (coolingType ? String(coolingType).trim() : null) : currentVehicle.coolingType,
        purchaseDate: purchaseDate !== undefined ? (purchaseDate ? new Date(purchaseDate) : null) : currentVehicle.purchaseDate,
        imageUrl: finalImageUrl,
        obdConnected: obdConnected !== undefined ? Boolean(obdConnected) : currentVehicle.obdConnected,
        lastObdSyncAt: obdConnected ? new Date() : currentVehicle.lastObdSyncAt,
      },
      include: {
        schedules: {
          orderBy: { nextDueDate: "asc" },
        },
        diagnostics: {
          orderBy: { scanDate: "desc" },
        },
        maintenanceRecords: {
          orderBy: { serviceDate: "desc" },
        },
        fuelLogs: {
          orderBy: { logDate: "desc" },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const vehicle = await db.vehicle.findUnique({
      where: { id: params.id },
    });

    if (!vehicle || vehicle.userId !== session.userId) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    await db.vehicle.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return NextResponse.json({ error: "Failed to delete vehicle" }, { status: 500 });
  }
}
