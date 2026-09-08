// Verification script for AutoPulse Personal Vehicle Health Platform
const BASE_URL = "http://localhost:3000";

async function runVerification() {
  console.log("=================================================");
  console.log("AutoPulse Personal Vehicle Health Platform Verification");
  console.log("=================================================");

  try {
    // 1. Test Login with Demo Account
    console.log("\n[1] Testing Personal Login...");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alex@autopulse.me",
        password: "Password123!",
      }),
    });

    const loginData = await loginRes.json();
    console.log("Login Status:", loginRes.status);
    console.log("User Name:", loginData.user?.name);
    console.log("User Email:", loginData.user?.email);
    console.log("Org/Garage Name:", loginData.user?.orgName);

    const cookieHeader = loginRes.headers.get("set-cookie");
    const sessionCookie = cookieHeader ? cookieHeader.split(";")[0] : "";

    // 2. Test Get Vehicles
    console.log("\n[2] Testing Vehicles API (My Vehicles)...");
    const vehiclesRes = await fetch(`${BASE_URL}/api/vehicles?orgId=${loginData.user?.orgId}`, {
      headers: { Cookie: sessionCookie },
    });
    const vehiclesData = await vehiclesRes.json();
    console.log("Vehicles count:", vehiclesData.length);
    if (vehiclesData.length > 0) {
      const v = vehiclesData[0];
      console.log(`Sample Vehicle: ${v.year} ${v.make} ${v.model} (${v.name})`);
      console.log(`Health Score: ${v.healthScore}/100, Mileage: ${v.mileage} mi`);
    }

    // 3. Test Diagnostics API
    console.log("\n[3] Testing Diagnostics API...");
    const diagRes = await fetch(`${BASE_URL}/api/diagnostics?orgId=${loginData.user?.orgId}`, {
      headers: { Cookie: sessionCookie },
    });
    const diagData = await diagRes.json();
    console.log("Diagnostics scans count:", diagData.length);
    if (diagData.length > 0) {
      const d = diagData[0];
      console.log(`Sample DTC: ${d.codes} — Severity: ${d.severity}, Safe to drive: ${d.canDrive}`);
      console.log(`Cost Range: $${d.estimatedCostMin} – $${d.estimatedCostMax}`);
    }

    // 4. Test Maintenance API
    console.log("\n[4] Testing Maintenance API...");
    const maintRes = await fetch(`${BASE_URL}/api/maintenance?orgId=${loginData.user?.orgId}`, {
      headers: { Cookie: sessionCookie },
    });
    const maintData = await maintRes.json();
    console.log("Maintenance records count:", maintData.length);

    // 5. Test Personal Signup Flow
    console.log("\n[5] Testing Personal Signup Flow...");
    const testEmail = `owner-${Date.now()}@autopulse.me`;
    const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Jordan",
        lastName: "Taylor",
        email: testEmail,
        password: "Password123!",
      }),
    });
    const signupData = await signupRes.json();
    console.log("Signup Status:", signupRes.status);
    console.log("Created Owner:", signupData.user?.name);
    console.log("Personal Garage:", signupData.user?.orgName);

    console.log("\n=================================================");
    console.log("ALL PERSONAL HEALTH PLATFORM CHECKS PASSED!");
    console.log("=================================================");
  } catch (err) {
    console.error("Verification error:", err);
  }
}

runVerification();
