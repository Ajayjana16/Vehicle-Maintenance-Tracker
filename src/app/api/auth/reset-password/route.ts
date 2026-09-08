import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const { email, token, newPassword, confirmPassword } = body || {};

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Password reset token is missing or invalid." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json(
        { error: "New password is required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: "Password must contain uppercase, lowercase, number, and a special character." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    // Find user by resetToken
    let user = await db.user.findFirst({
      where: { resetToken: token },
    });

    if (!user && email && typeof email === "string") {
      user = await db.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      if (user && user.resetToken !== token) {
        user = null;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired password reset link. Please request a new one." },
        { status: 400 }
      );
    }

    // Check expiration
    if (user.resetTokenExpiry && new Date(user.resetTokenExpiry) < new Date()) {
      return NextResponse.json(
        { error: "This password reset link has expired. Please request a new link." },
        { status: 400 }
      );
    }

    // Hash and update
    const passwordHash = await hashPassword(newPassword);
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully updated. You may now sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Unable to reset password. Please try again." },
      { status: 500 }
    );
  }
}
