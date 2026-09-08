import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { GlobalSearchResult } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().toLowerCase();

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Search User's Vehicles
    const vehicles = await db.vehicle.findMany({
      where: {
        userId: session.userId,
        OR: [
          { name: { contains: query } },
          { make: { contains: query } },
          { model: { contains: query } },
          { vin: { contains: query } },
          { licensePlate: { contains: query } },
        ],
      },
      take: 5,
    });

    // Search Diagnostic Scans for User's Vehicles
    const scans = await db.diagnosticScan.findMany({
      where: {
        vehicle: {
          userId: session.userId,
        },
        OR: [
          { codes: { contains: query } },
          { symptoms: { contains: query } },
          { aiSummary: { contains: query } },
        ],
      },
      include: { vehicle: true },
      take: 5,
    });

    // Search Maintenance Records for User's Vehicles
    const maintenance = await db.maintenanceRecord.findMany({
      where: {
        vehicle: {
          userId: session.userId,
        },
        OR: [
          { title: { contains: query } },
          { provider: { contains: query } },
          { notes: { contains: query } },
        ],
      },
      include: { vehicle: true },
      take: 5,
    });

    const results: GlobalSearchResult[] = [];

    // Map Vehicles
    vehicles.forEach((v) => {
      results.push({
        id: `vehicle-${v.id}`,
        type: "VEHICLE",
        title: `${v.year} ${v.make} ${v.model}`,
        subtitle: `${v.name} · Plate: ${v.licensePlate || "N/A"} · ${v.mileage.toLocaleString()} mi`,
        badge: `${v.healthScore}% Health`,
        href: `/garage/${v.id}`,
      });
    });

    // Map DTC Scans
    scans.forEach((s) => {
      results.push({
        id: `dtc-${s.id}`,
        type: "DTC",
        title: `DTC Scan: ${s.codes || "System Check"}`,
        subtitle: `${s.vehicle.year} ${s.vehicle.make} ${s.vehicle.model} · ${s.aiSummary.slice(0, 70)}...`,
        badge: s.severity,
        href: `/diagnostics?vehicleId=${s.vehicleId}`,
      });
    });

    // Map Maintenance
    maintenance.forEach((m) => {
      results.push({
        id: `maint-${m.id}`,
        type: "MAINTENANCE",
        title: m.title,
        subtitle: `${m.vehicle.year} ${m.vehicle.make} ${m.vehicle.model} · $${m.cost} · ${m.provider || "Self-serviced"}`,
        badge: m.serviceType,
        href: `/maintenance?vehicleId=${m.vehicleId}`,
      });
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching user catalog:", error);
    return NextResponse.json({ error: "Failed to perform search" }, { status: 500 });
  }
}
