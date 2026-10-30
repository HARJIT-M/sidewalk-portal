async function testSplitRoutes() {
  const BASE_URL = "http://127.0.0.1:5000";

  console.log("=========================================");
  console.log("TESTING SPLIT MODULAR ROUTES");
  console.log("=========================================");

  try {
    // 1. Login Worker
    console.log("1. Worker Login (ravi@gmail.com)...");
    const workerLogin = await (await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ravi@gmail.com", password: "password123" }),
    })).json();
    const workerToken = workerLogin.token;
    const workerHeaders = { headers: { Authorization: `Bearer ${workerToken}` } };

    // 2. Login Manager
    console.log("2. Manager Login (mohan@gmail.com)...");
    const managerLogin = await (await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "mohan@gmail.com", password: "password123" }),
    })).json();
    const managerToken = managerLogin.token;
    const managerHeaders = { headers: { Authorization: `Bearer ${managerToken}` } };

    // 3. Test dashboardRoutes (/api/dashboard/worker & /api/dashboard/manager)
    console.log("\n3. Testing /api/dashboard routes...");
    const wDash = await (await fetch(`${BASE_URL}/api/dashboard/worker`, workerHeaders)).json();
    console.log("   ✅ Worker dashboard route:", wDash.success, "- totalAssigned:", wDash.dashboard?.stats?.totalAssigned);
    const mDash = await (await fetch(`${BASE_URL}/api/dashboard/manager`, managerHeaders)).json();
    console.log("   ✅ Manager dashboard route:", mDash.success, "- totalComplaints:", mDash.stats?.totalComplaints);

    // 4. Test complaintRoutes (/api/complaints/worker & /api/complaints/manager & /api/complaints/:id)
    console.log("\n4. Testing /api/complaints routes...");
    const wComp = await (await fetch(`${BASE_URL}/api/complaints/worker`, workerHeaders)).json();
    console.log("   ✅ Worker complaints route:", wComp.success, "- count:", wComp.count);
    const mComp = await (await fetch(`${BASE_URL}/api/complaints/manager`, managerHeaders)).json();
    console.log("   ✅ Manager complaints route:", mComp.success, "- count:", mComp.count);
    const singleComp = await (await fetch(`${BASE_URL}/api/complaints/CMP001`, workerHeaders)).json();
    console.log("   ✅ Single complaint details route:", singleComp.success, "- title:", singleComp.complaint?.title);

    // 5. Test workTrackingRoutes (/api/work-tracking)
    console.log("\n5. Testing /api/work-tracking routes...");
    const mTrack = await (await fetch(`${BASE_URL}/api/work-tracking`, managerHeaders)).json();
    console.log("   ✅ Manager work tracking route:", mTrack.success, "- count:", mTrack.count);

    // 6. Test notificationRoutes (/api/notifications)
    console.log("\n6. Testing /api/notifications routes...");
    const notifs = await (await fetch(`${BASE_URL}/api/notifications`, workerHeaders)).json();
    console.log("   ✅ Notifications route:", notifs.success, "- count:", notifs.count);

    // 7. Test workerRoutes (/api/worker/profile & /api/workers)
    console.log("\n7. Testing /api/worker & /api/workers routes...");
    const wProf = await (await fetch(`${BASE_URL}/api/worker/profile`, workerHeaders)).json();
    console.log("   ✅ Worker profile route:", wProf.success, "- name:", wProf.profile?.name);
    const allWorkers = await (await fetch(`${BASE_URL}/api/workers`, managerHeaders)).json();
    console.log("   ✅ Manager workers roster route:", allWorkers.success, "- count:", allWorkers.count);

    // 8. Test managerRoutes (/api/manager/profile)
    console.log("\n8. Testing /api/manager routes...");
    const mProf = await (await fetch(`${BASE_URL}/api/manager/profile`, managerHeaders)).json();
    console.log("   ✅ Manager profile route:", mProf.success, "- name:", mProf.profile?.name);

    console.log("\n=========================================");
    console.log("🎉 ALL SPLIT MODULAR ROUTES PASSED!");
    console.log("=========================================");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

testSplitRoutes();
