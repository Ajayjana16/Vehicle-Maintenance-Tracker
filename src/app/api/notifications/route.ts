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
    const status = searchParams.get("status") || undefined;

    const where: any = { userId: session.userId };
    if (status && status !== "ALL") where.status = status;

    const notifications = await db.notification.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            make: true,
            model: true,
            year: true,
            licensePlate: true,
            healthScore: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, markAllRead } = body;

    if (markAllRead) {
      await db.notification.updateMany({
        where: { userId: session.userId, status: "UNREAD" },
        data: { status: "READ" },
      });
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (!id || !status) {
      return NextResponse.json({ error: "Notification ID and status required" }, { status: 400 });
    }

    const notification = await db.notification.findFirst({
      where: { id, userId: session.userId },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    const updated = await db.notification.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
