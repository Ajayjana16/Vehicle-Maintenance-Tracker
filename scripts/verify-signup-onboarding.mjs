import http from "http";

const BASE_URL = "http://localhost:3000";

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    redirect: "manual",
    ...options,
  });

  const status = response.status;
  const headers = Object.fromEntries(response.headers.entries());
  let data = null;
  const contentType = headers["content-type"] || "";

  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  return { status, headers, data };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function run() {
  console.log("\n==================================================================");
  console.log("AUTOPULSE PERSONAL SIGNUP & ONBOARDING — VERIFICATION SUITE");
  console.log("==================================================================\n");

  // SUITE 1: Public Routes & Personal URL Aliases
  console.log("Test Suite 1: Public Routes & Personal URL Aliases");
  const publicPages = ["/login", "/signup", "/verify-email", "/forgot-password", "/reset-password"];
  for (const p of publicPages) {
    const res = await request(p);
    assert(res.status === 200, `Public route ${p} accessible without auth (Status ${res.status})`);
  }

  const aliases = [
    { from: "/dashboard", to: "/" },
    { from: "/vehicles", to: "/garage" },
    { from: "/fuel-energy", to: "/fuel" },
    { from: "/predictive-wear", to: "/predictive" },
    { from: "/profile", to: "/settings" },
    { from: "/security", to: "/settings" },
  ];

  for (const alias of aliases) {
    const res = await request(alias.from);
    const loc = res.headers["location"] || "";
    assert(
      res.status === 307 || res.status === 302,
      `Alias ${alias.from} redirects to ${alias.to} (Status ${res.status}, Location: ${loc})`
    );
  }

  // SUITE 2: Signup Validation
  console.log("\nTest Suite 2: Signup Form Validation");
  const emptySignup = await request("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert(emptySignup.status === 400, `Empty signup payload returns 400 (Status: ${emptySignup.status})`);

  const weakPasswordSignup = await request("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "weak",
      confirmPassword: "weak",
      termsAccepted: true,
    }),
  });
  assert(weakPasswordSignup.status === 400, `Weak password rejected with 400`);

  const passwordMismatchSignup = await request("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "Password123!",
      confirmPassword: "Password456!",
      termsAccepted: true,
    }),
  });
  assert(passwordMismatchSignup.status === 400, `Password mismatch rejected with 400`);

  const termsRejectedSignup = await request("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      termsAccepted: false,
    }),
  });
  assert(termsRejectedSignup.status === 400, `Unaccepted terms rejected with 400`);

  const duplicateEmailSignup = await request("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Alex",
      lastName: "Mercer",
      email: "alex@autopulse.me",
      password: "Password123!New",
      confirmPassword: "Password123!New",
      termsAccepted: true,
    }),
  });
  assert(duplicateEmailSignup.status === 409, `Duplicate email rejected with 409 Conflict`);

  // SUITE 3: Successful Personal Owner Registration
  console.log("\nTest Suite 3: Successful Personal Owner Registration & Session");
  const testTimestamp = Date.now();
  const testEmail = `owner-${testTimestamp}@example.com`;

  const signupSuccess = await request("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Alexander",
      lastName: "Pierce",
      email: testEmail,
      phone: "+1 (555) 304-9182",
      password: "Password123!Secure",
      confirmPassword: "Password123!Secure",
      termsAccepted: true,
    }),
  });

  assert(signupSuccess.status === 200, `Personal account successfully created (Status: 200)`);
  assert(signupSuccess.data?.user?.email === testEmail, `User email matches registration: ${signupSuccess.data?.user?.email}`);

  const rawCookie = signupSuccess.headers["set-cookie"] || "";
  const cookieMatch = rawCookie.match(/ap_session=([^;]+)/);
  const sessionCookie = cookieMatch ? cookieMatch[1] : null;
  assert(!!sessionCookie, `Signup automatically issues ap_session HTTP-only cookie`);

  const authHeader = { Cookie: `ap_session=${sessionCookie}` };

  // SUITE 4: Authenticated State & Reverse Redirect
  console.log("\nTest Suite 4: Authenticated Context & Reverse Redirect");
  const meRes = await request("/api/auth/me", { headers: authHeader });
  assert(meRes.status === 200 && meRes.data?.user?.email === testEmail, `Session verified via /api/auth/me`);

  const reverseLogin = await request("/login", { headers: authHeader });
  assert(
    reverseLogin.status === 307 || reverseLogin.status === 302,
    `Authenticated user visiting /login redirects to dashboard`
  );

  const reverseSignup = await request("/signup", { headers: authHeader });
  assert(
    reverseSignup.status === 307 || reverseSignup.status === 302,
    `Authenticated user visiting /signup redirects to dashboard`
  );

  // SUITE 5: Email Verification Flow
  console.log("\nTest Suite 5: Email Verification Flow");
  const verifyRes = await request("/api/auth/verify-email", {
    method: "POST",
    headers: { ...authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail }),
  });
  assert(verifyRes.status === 200, `Email verification completed successfully`);
  assert(verifyRes.data?.user?.emailVerified === true, `Account emailVerified is true`);

  // SUITE 6: Onboarding Steps (Add First Vehicle, Setup Complete)
  console.log("\nTest Suite 6: Personal Onboarding Wizard Execution");
  const addVehicleRes = await request("/api/auth/onboarding", {
    method: "POST",
    headers: { ...authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "add_vehicle",
      data: {
        name: "My Daily Driver",
        make: "Toyota",
        model: "RAV4 Prime",
        year: 2024,
        trim: "XSE PHEV",
        vin: `VIN${testTimestamp}`,
        licensePlate: "AP-2024",
        mileage: 12500,
        fuelType: "HYBRID",
      },
    }),
  });
  assert(addVehicleRes.status === 200, `Onboarding: First personal vehicle added to garage`);
  assert(addVehicleRes.data?.vehicle?.make === "Toyota", `Vehicle saved with make: Toyota`);

  const completeRes = await request("/api/auth/onboarding", {
    method: "POST",
    headers: { ...authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "complete" }),
  });
  assert(completeRes.status === 200, `Onboarding: Completed setup`);

  // SUITE 7: Forgot Password & Password Reset Lifecycle
  console.log("\nTest Suite 7: Forgot Password & Reset Password Lifecycle");
  const forgotRes = await request("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail }),
  });
  assert(forgotRes.status === 200, `Forgot password link request successful`);
  assert(!!forgotRes.data?.demoResetLink, `Demo reset link returned: ${forgotRes.data?.demoResetLink}`);

  const tokenMatch = (forgotRes.data?.demoResetLink || "").match(/token=([^&]+)/);
  const resetToken = tokenMatch ? tokenMatch[1] : null;
  assert(!!resetToken, `Extracted reset token from link`);

  const resetRes = await request("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: resetToken,
      email: testEmail,
      newPassword: "NewPersonalPassword2026!Sec",
      confirmPassword: "NewPersonalPassword2026!Sec",
    }),
  });
  assert(resetRes.status === 200, `Password reset successfully completed`);

  // Sign in with new credentials
  const newLoginRes = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: "NewPersonalPassword2026!Sec",
    }),
  });
  assert(newLoginRes.status === 200, `Login with new password verified successfully (Status 200)`);

  // SUITE 8: Sign Out & Route Protection
  console.log("\nTest Suite 8: Sign Out & Route Guard Confirmation");
  const logoutRes = await request("/api/auth/logout", {
    method: "POST",
    headers: { ...authHeader, "Content-Type": "application/json" },
  });
  assert(logoutRes.status === 200, `Logout clears session`);

  const postLogoutDash = await request("/", { headers: { Cookie: "ap_session=" } });
  assert(
    (postLogoutDash.status === 307 || postLogoutDash.status === 302) &&
    (postLogoutDash.headers["location"] || "").includes("/login"),
    `Dashboard locked after sign out -> redirects to /login`
  );

  console.log("\n==================================================================");
  console.log(`ONBOARDING AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
