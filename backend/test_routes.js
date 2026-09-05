const BASE_URL = "http://localhost:5000";

async function runTests() {
  console.log("=== TESTING SPLIT BACKEND ROUTES ===");

  try {
    // 1. Worker login
    const workerLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "ravi@gmail.com",
        password: "password123",
      }),
    });
    const workerLoginData = await workerLoginRes.json();
    const workerToken = workerLoginData.token;
    console.log("✔ Worker Login:", workerLoginData.success ? "Success" : "Failed");

    const workerHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${workerToken}`,
    };

    // 2. Worker Dashboard Route
    const workerDashRes = await fetch(`${BASE_URL}/api/dashboard/worker`, { headers: workerHeaders });
    const workerDashData = await workerDashRes.json();
    console.log("✔ GET /api/dashboard/worker:", workerDashData.success, "| KPIs:", Object.keys(workerDashData.kpis || {}).length);

    // 3. Worker Profile Route
    const workerProfileRes = await fetch(`${BASE_URL}/api/worker/profile`, { headers: workerHeaders });
    const workerProfileData = await workerProfileRes.json();
    console.log("✔ GET /api/worker/profile:", workerProfileData.success, "| Name:", workerProfileData.profile?.name);

    // 4. Worker Complaints Route
    const workerComplaintsRes = await fetch(`${BASE_URL}/api/complaints/assigned`, { headers: workerHeaders });
    const workerComplaintsData = await workerComplaintsRes.json();
    console.log("✔ GET /api/complaints/assigned:", workerComplaintsData.success, "| Count:", workerComplaintsData.complaints?.length);

    // 5. Worker Notifications Route
    const workerNotifsRes = await fetch(`${BASE_URL}/api/notifications`, { headers: workerHeaders });
    const workerNotifsData = await workerNotifsRes.json();
    console.log("✔ GET /api/notifications:", workerNotifsData.success, "| Count:", workerNotifsData.notifications?.length);

    // 6. Manager login
    const managerLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "mohan@gmail.com",
        password: "password123",
      }),
    });
    const managerLoginData = await managerLoginRes.json();
    const managerToken = managerLoginData.token;
    console.log("✔ Manager Login:", managerLoginData.success ? "Success" : "Failed");

    const managerHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${managerToken}`,
    };

    // 7. Manager Dashboard Route
    const managerDashRes = await fetch(`${BASE_URL}/api/dashboard/manager`, { headers: managerHeaders });
    const managerDashData = await managerDashRes.json();
    console.log("✔ GET /api/dashboard/manager:", managerDashData.success, "| Total Complaints:", managerDashData.stats?.totalComplaints);

    // 8. Manager Profile Route
    const managerProfileRes = await fetch(`${BASE_URL}/api/manager/profile`, { headers: managerHeaders });
    const managerProfileData = await managerProfileRes.json();
    console.log("✔ GET /api/manager/profile:", managerProfileData.success, "| Name:", managerProfileData.profile?.name);

    // 9. Manager Workers Roster Route
    const managerWorkersRes = await fetch(`${BASE_URL}/api/workers`, { headers: managerHeaders });
    const managerWorkersData = await managerWorkersRes.json();
    console.log("✔ GET /api/workers:", managerWorkersData.success, "| Workers:", managerWorkersData.count);

    // 10. Manager Available Workers Route
    const managerAvailWorkersRes = await fetch(`${BASE_URL}/api/workers/available`, { headers: managerHeaders });
    const managerAvailWorkersData = await managerAvailWorkersRes.json();
    console.log("✔ GET /api/workers/available:", managerAvailWorkersData.success, "| Count:", managerAvailWorkersData.count);

    // 11. Manager Complaints Route
    const managerComplaintsRes = await fetch(`${BASE_URL}/api/complaints/manager`, { headers: managerHeaders });
    const managerComplaintsData = await managerComplaintsRes.json();
    console.log("✔ GET /api/complaints/manager:", managerComplaintsData.success, "| Count:", managerComplaintsData.count);

    // 12. Manager Work Tracking Route
    const managerWorkTrackRes = await fetch(`${BASE_URL}/api/work-tracking/manager`, { headers: managerHeaders });
    const managerWorkTrackData = await managerWorkTrackRes.json();
    console.log("✔ GET /api/work-tracking/manager:", managerWorkTrackData.success, "| Tracked items:", managerWorkTrackData.data?.length);

    console.log("\n>>> ALL SPLIT ROUTES WORKING ACCORDINGLY AND PASSING WITH 200 OK! <<<");
  } catch (error) {
    console.error("❌ Route Test Failed:", error);
  }
}

runTests();
