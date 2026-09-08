import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const { action, data } = body || {};

    const user = await db.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User record not found." }, { status: 404 });
    }

    // Handle specific onboarding step actions
    if (action === "add_vehicle" && data) {
      const { name, make, model, year, trim, vin, licensePlate, mileage, fuelType } = data;
      const parsedYear = parseInt(year) || new Date().getFullYear();
      const parsedMileage = parseInt(mileage) || 15000;

      const vehicle = await db.vehicle.create({
        data: {
          userId: user.id,
          name: name || `${parsedYear} ${make || "Vehicle"} ${model || "Car"}`,
          make: make || "Toyota",
          model: model || "RAV4",
          year: parsedYear,
          trim: trim || null,
          vin: vin || null,
          licensePlate: licensePlate || null,
          mileage: parsedMileage,
          fuelType: fuelType || "GASOLINE",
          healthScore: 92,
          obdConnected: true,
          schedules: {
            create: [
              {
                taskName: "Engine Oil & Filter Replacement",
                category: "ENGINE",
                intervalMiles: 5000,
                intervalMonths: 6,
                nextDueMileage: parsedMileage + 5000,
                nextDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
                urgency: "GOOD",
                estimatedCost: 85,
              },
              {
                taskName: "Tire Rotation & Brake Inspection",
                category: "TIRES",
                intervalMiles: 6000,
                intervalMonths: 6,
                nextDueMileage: parsedMileage + 6000,
                nextDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
                urgency: "GOOD",
                estimatedCost: 45,
              },
            ],
          },
        },
      });

      return NextResponse.json({ success: true, vehicle, nextStep: 3 });
    }

    if (action === "complete") {
      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Welcome to AutoPulse!",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding step error:", error);
    return NextResponse.json(
      { error: "Failed to save onboarding configuration. Please try again." },
      { status: 500 }
    );
  }
}
