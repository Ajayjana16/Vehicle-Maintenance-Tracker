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

    if (!vehicleId) {
      return NextResponse.json({ error: "vehicleId is required" }, { status: 400 });
    }

    const vehicle = await db.vehicle.findFirst({
      where: { id: vehicleId, userId: session.userId },
      include: {
        schedules: true,
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const dailyMiles = vehicle.avgDailyMiles || 35;
    const currentMiles = vehicle.mileage;

    // Component Wear & Milestone Projections
    const projections = vehicle.schedules.map((item) => {
      const milesRemaining = item.nextDueMileage - currentMiles;
      const daysRemaining = Math.round(milesRemaining / dailyMiles);

      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + Math.max(0, daysRemaining));

      // Calculate wear percentage: 0% = Brand new, 100% = Fully worn/overdue
      const totalInterval = item.intervalMiles || 7500;
      const milesTraveledSinceLast = item.lastServicedMileage
        ? currentMiles - item.lastServicedMileage
        : totalInterval - Math.max(0, milesRemaining);

      const wearPercent = Math.min(100, Math.max(0, Math.round((milesTraveledSinceLast / totalInterval) * 100)));

      return {
        id: item.id,
        taskName: item.taskName,
        category: item.category,
        wearPercent,
        milesRemaining,
        daysRemaining,
        estimatedDueDate: estimatedDate.toISOString().split("T")[0],
        estimatedCost: item.estimatedCost || 95,
        urgency:
          milesRemaining <= 0
            ? "OVERDUE"
            : milesRemaining <= 1000 || daysRemaining <= 30
            ? "DUE_SOON"
            : "GOOD",
      };
    });

    // 12-Month Projected Budget
    const next12MonthsBudget = projections
      .filter((p) => p.daysRemaining <= 365)
      .reduce((sum, p) => sum + p.estimatedCost, 0);

    return NextResponse.json({
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      currentMileage: currentMiles,
      avgDailyMiles: dailyMiles,
      next12MonthsBudget,
      projections,
    });
  } catch (error) {
    console.error("Error generating predictive schedule:", error);
    return NextResponse.json({ error: "Failed to generate predictions" }, { status: 500 });
  }
}
