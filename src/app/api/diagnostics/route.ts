import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { analyzeVehicleDiagnosticAI } from "@/lib/gemini";
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

    const where: any = {
      vehicle: { userId: session.userId },
    };
    if (vehicleId) where.vehicleId = vehicleId;

    const scans = await db.diagnosticScan.findMany({
      where,
      include: {
        vehicle: {
          select: { id: true, name: true, make: true, model: true, year: true },
        },
      },
      orderBy: { scanDate: "desc" },
    });

    return NextResponse.json(scans);
  } catch (error) {
    console.error("Error fetching diagnostic scans:", error);
    return NextResponse.json({ error: "Failed to fetch diagnostic scans" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { vehicleId, codes, symptoms, dataSource, apiKey } = body;

    if (!vehicleId || (!codes && !symptoms)) {
      return NextResponse.json(
        { error: "Vehicle and at least one fault code or symptom description are required" },
        { status: 400 }
      );
    }

    const vehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
      include: { schedules: true, diagnostics: true },
    });

    if (!vehicle || vehicle.userId !== session.userId) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Call AI analyzer (Gemini or ASE Master heuristic fallback)
    const analysis = await analyzeVehicleDiagnosticAI(
      {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        mileage: vehicle.mileage,
        fuelType: vehicle.fuelType,
      },
      codes || "",
      symptoms || "",
      apiKey
    );

    // Save scan to database
    const scan = await db.diagnosticScan.create({
      data: {
        vehicleId,
        codes: (codes || "SYMPTOM_CHECK").toUpperCase().trim(),
        symptoms: symptoms || null,
        severity: analysis.severity,
        canDrive: analysis.canDrive,
        aiSummary: analysis.aiSummary,
        possibleCauses: JSON.stringify(analysis.possibleCauses),
        diySteps: JSON.stringify(analysis.diySteps),
        estimatedCostMin: analysis.estimatedCostMin,
        estimatedCostMax: analysis.estimatedCostMax,
        status: "ACTIVE",
        dataSource: dataSource || (codes ? "OBD_II" : "MANUAL"),
      },
    });

    // Recalculate vehicle health score
    const updatedDiagnostics = [...vehicle.diagnostics, scan];
    const newHealthScore = calculateVehicleHealthScore(
      vehicle.mileage,
      vehicle.year,
      vehicle.schedules,
      updatedDiagnostics
    );

    await db.vehicle.update({
      where: { id: vehicleId },
      data: { healthScore: newHealthScore },
    });

    return NextResponse.json(
      {
        scan,
        analysis,
        newHealthScore,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error analyzing diagnostics:", error);
    return NextResponse.json({ error: "Diagnostic analysis failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Scan ID and status are required" }, { status: 400 });
    }
    if (!["ACTIVE", "RESOLVED", "DISMISSED"].includes(status)) {
      return NextResponse.json({ error: "Invalid diagnostic status" }, { status: 400 });
    }

    const existingScan = await db.diagnosticScan.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!existingScan || existingScan.vehicle.userId !== session.userId) {
      return NextResponse.json({ error: "Diagnostic scan not found" }, { status: 404 });
    }

    const updated = await db.diagnosticScan.update({
      where: { id },
      data: { status },
      include: { vehicle: { include: { schedules: true, diagnostics: true } } },
    });

    // Recalculate health
    const newHealthScore = calculateVehicleHealthScore(
      updated.vehicle.mileage,
      updated.vehicle.year,
      updated.vehicle.schedules,
      updated.vehicle.diagnostics
    );

    await db.vehicle.update({
      where: { id: updated.vehicleId },
      data: { healthScore: newHealthScore },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating scan status:", error);
    return NextResponse.json({ error: "Failed to update scan" }, { status: 500 });
  }
}
