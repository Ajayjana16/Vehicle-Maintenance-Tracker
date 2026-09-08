import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload. Expected JSON body." },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      name,
      email,
      phone,
      password,
      confirmPassword,
      termsAccepted,
    } = body;

    const resolvedName = (name || `${firstName || ""} ${lastName || ""}`).trim();

    // 1. Personal Information Validation
    if (!resolvedName) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // 2. Password Strength Validation
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match. Please re-enter your password." },
        { status: 400 }
      );
    }

    // 3. Terms of Service Acceptance
    if (termsAccepted === false) {
      return NextResponse.json(
        { error: "You must accept the Terms of Service to proceed." },
        { status: 400 }
      );
    }

    // 4. Check if email already registered
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // 5. Hash password securely
    const passwordHash = await hashPassword(password);

    // 6. Create User
    const user = await db.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        name: resolvedName,
        firstName: firstName ? String(firstName).trim() : resolvedName.split(" ")[0],
        lastName: lastName ? String(lastName).trim() : resolvedName.split(" ").slice(1).join(" "),
        phone: phone ? String(phone).trim() : null,
        emailVerified: true,
      },
    });

    // 7. Issue session cookie so user is immediately authenticated
    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };

    await setSessionCookie(sessionPayload);

    return NextResponse.json({
      success: true,
      message: "Account successfully created.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error("Signup registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while creating your account. Please try again." },
      { status: 500 }
    );
  }
}
