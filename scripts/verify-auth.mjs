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
  console.log("\n=======================================================");
  console.log("AUTOPULSE PERSONAL AUTHENTICATION AUDIT & VERIFICATION");
  console.log("=======================================================\n");

  // TEST 1: Unauthenticated Protected Route Redirects
  console.log("Test Suite 1: Unauthenticated Access to Protected Routes");
  const protectedRoutes = [
    "/",
    "/garage",
    "/maintenance",
    "/diagnostics",
    "/fuel",
    "/predictive",
    "/settings",
  ];

  for (const route of protectedRoutes) {
    const res = await request(route);
    const location = res.headers["location"] || "";
    const isRedirect = res.status === 307 || res.status === 302;
    const hasLoginTarget = location.includes("/login");
    assert(
      isRedirect && hasLoginTarget,
      `Unauthenticated ${route} redirects to /login (Status ${res.status}, Location: ${location})`
    );
  }

  // TEST 2: Public Login Route
  console.log("\nTest Suite 2: Public Route Accessibility");
  const loginRes = await request("/login");
  assert(loginRes.status === 200, `GET /login returns 200 OK (Status: ${loginRes.status})`);

  // TEST 3: Validation & Error Handling
  console.log("\nTest Suite 3: Validation & Invalid Credentials");
  const emptyRes = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert(emptyRes.status === 400, `Empty payload returns 400 Bad Request (Status: ${emptyRes.status})`);

  const badEmailRes = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "invalid-email", password: "some-password" }),
  });
  assert(badEmailRes.status === 400, `Invalid email format returns 400 (Status: ${badEmailRes.status})`);

  const wrongPassRes = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "alex@autopulse.me", password: "IncorrectPassword123" }),
  });
  assert(wrongPassRes.status === 401, `Incorrect password returns 401 Unauthorized (Status: ${wrongPassRes.status})`);
  assert(
    wrongPassRes.data?.error?.includes("Invalid email or password"),
    `Error message is safe and does not leak account existence: "${wrongPassRes.data?.error}"`
  );

  // TEST 4: Successful Authentication
  console.log("\nTest Suite 4: Successful Authentication & Session Cookie");
  const loginSuccessRes = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "alex@autopulse.me",
      password: "Password123!",
      rememberMe: true,
    }),
  });

  assert(loginSuccessRes.status === 200, `Valid credentials return 200 OK (Status: ${loginSuccessRes.status})`);
  assert(loginSuccessRes.data?.success === true, `Response body contains success: true`);
  assert(
    loginSuccessRes.data?.user?.email === "alex@autopulse.me",
    `Response returns correct user object (${loginSuccessRes.data?.user?.name})`
  );

  const rawSetCookie = loginSuccessRes.headers["set-cookie"] || "";
  assert(rawSetCookie.includes("ap_session="), `Set-Cookie header sets ap_session cookie`);
  assert(rawSetCookie.includes("HttpOnly") || rawSetCookie.includes("httponly"), `Cookie has HttpOnly flag set`);

  // Extract session cookie value
  const cookieMatch = rawSetCookie.match(/ap_session=([^;]+)/);
  const sessionCookie = cookieMatch ? cookieMatch[1] : null;

  if (!sessionCookie) {
    console.error("FATAL: Failed to obtain session cookie from login response.");
    process.exit(1);
  }

  // TEST 5: Authenticated Session Access
  console.log("\nTest Suite 5: Accessing Protected Routes with Valid Session");
  const cookieHeader = `ap_session=${sessionCookie}`;

  const meRes = await request("/api/auth/me", {
    headers: { Cookie: cookieHeader },
  });
  assert(meRes.status === 200, `GET /api/auth/me with session returns 200 OK`);
  assert(meRes.data?.authenticated === true, `User is reported as authenticated: true`);

  const authedDashRes = await request("/", {
    headers: { Cookie: cookieHeader },
  });
  assert(
    authedDashRes.status === 200,
    `GET / with valid session cookie returns 200 OK (no redirect)`
  );

  const authedGarageRes = await request("/garage", {
    headers: { Cookie: cookieHeader },
  });
  assert(
    authedGarageRes.status === 200,
    `GET /garage with valid session cookie returns 200 OK`
  );

  // Authenticated user accessing /login should redirect to /
  const authedLoginRes = await request("/login", {
    headers: { Cookie: cookieHeader },
  });
  const authedLoginLocation = authedLoginRes.headers["location"] || "";
  assert(
    (authedLoginRes.status === 307 || authedLoginRes.status === 302) &&
    (authedLoginLocation === "/" || authedLoginLocation.endsWith(":3000/")),
    `Authenticated user visiting /login redirects to dashboard (Location: ${authedLoginLocation})`
  );

  // TEST 6: Other Personal Owner Logins
  console.log("\nTest Suite 6: Other Personal Owner Authentication");
  const sarahLoginRes = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "sarah@autopulse.me",
      password: "Password123!",
    }),
  });
  assert(sarahLoginRes.status === 200, `Sarah Chen signs in successfully`);

  const marcusLoginRes = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "marcus@autopulse.me",
      password: "Password123!",
    }),
  });
  assert(marcusLoginRes.status === 200, `Marcus Vance signs in successfully`);

  // TEST 7: Logout
  console.log("\nTest Suite 7: Session Termination & Logout");
  const logoutRes = await request("/api/auth/logout", {
    method: "POST",
    headers: {
      Cookie: cookieHeader,
      "Content-Type": "application/json",
    },
  });
  assert(logoutRes.status === 200, `POST /api/auth/logout returns 200 OK`);

  const logoutSetCookie = logoutRes.headers["set-cookie"] || "";
  assert(
    logoutSetCookie.includes("ap_session=;") ||
    logoutSetCookie.includes("Max-Age=0") ||
    logoutSetCookie.includes("max-age=0") ||
    logoutSetCookie.includes("expires="),
    `Logout response clears ap_session cookie via Set-Cookie Max-Age=0`
  );

  // Verify access after logout with the cleared cookie
  const postLogoutMe = await request("/api/auth/me", {
    headers: { Cookie: "ap_session=" },
  });
  assert(postLogoutMe.status === 401, `GET /api/auth/me after logout returns 401 Unauthorized`);

  const postLogoutDash = await request("/", {
    headers: { Cookie: "ap_session=" },
  });
  assert(
    (postLogoutDash.status === 307 || postLogoutDash.status === 302) &&
    (postLogoutDash.headers["location"] || "").includes("/login"),
    `Accessing dashboard after logout redirects to /login`
  );

  console.log("\n=======================================================");
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
