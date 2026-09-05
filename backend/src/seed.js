const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

// Load env
dotenv.config({ path: [path.resolve(__dirname, "../.env"), path.resolve(__dirname, ".env")] });

const {
  User,
  Worker,
  Complaint,
  ComplaintImage,
  Assignment,
  StatusHistory,
  RepairHistory,
  Notification,
} = require("./schemas");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/digital_smartfooth";

const seedDatabase = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully.");

    // 1. Clear existing collections
    console.log("Clearing old data...");
    await User.deleteMany({});
    await Worker.deleteMany({});
    await Complaint.deleteMany({});
    await ComplaintImage.deleteMany({});
    await Assignment.deleteMany({});
    await StatusHistory.deleteMany({});
    await RepairHistory.deleteMany({});
    await Notification.deleteMany({});
    console.log("Old data cleared.");

    // Common password hash for test accounts
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 2. Create Users
    console.log("Creating Users (Citizens, Manager, Workers)...");
    const managerUser = await User.create({
      name: "Mohan Kumar",
      email: "mohan@gmail.com",
      phone: "+91 98765 43200",
      password: hashedPassword,
      role: "MANAGER",
      status: "ACTIVE",
    });

    const citizenKarthik = await User.create({
      name: "Karthik Raja",
      email: "karthik.raja@example.com",
      phone: "+91 98765 43210",
      password: hashedPassword,
      role: "CITIZEN",
      status: "ACTIVE",
    });

    const citizenArun = await User.create({
      name: "Arun Kumar",
      email: "arun@example.com",
      phone: "+91 98765 43201",
      password: hashedPassword,
      role: "CITIZEN",
      status: "ACTIVE",
    });

    const citizenPriya = await User.create({
      name: "Priya S",
      email: "priya@example.com",
      phone: "+91 98765 43202",
      password: hashedPassword,
      role: "CITIZEN",
      status: "ACTIVE",
    });

    // Worker Users
    const workerUser1 = await User.create({
      name: "Ravi Kumar",
      email: "ravi@gmail.com",
      phone: "9876543210",
      password: hashedPassword,
      role: "WORKER",
      status: "ACTIVE",
    });

    const workerUser2 = await User.create({
      name: "Karthik S",
      email: "karthik@gmail.com",
      phone: "9876543211",
      password: hashedPassword,
      role: "WORKER",
      status: "ACTIVE",
    });

    const workerUser3 = await User.create({
      name: "Manoj Kumar",
      email: "manoj@gmail.com",
      phone: "9876543212",
      password: hashedPassword,
      role: "WORKER",
      status: "ACTIVE",
    });

    const workerUser4 = await User.create({
      name: "Suresh R",
      email: "suresh@gmail.com",
      phone: "9876543213",
      password: hashedPassword,
      role: "WORKER",
      status: "ACTIVE",
    });

    const workerUser5 = await User.create({
      name: "Arun Prakash",
      email: "arun.prakash@gmail.com",
      phone: "9876543214",
      password: hashedPassword,
      role: "WORKER",
      status: "ACTIVE",
    });

    const workerUser6 = await User.create({
      name: "Dinesh M",
      email: "dinesh@gmail.com",
      phone: "9876543215",
      password: hashedPassword,
      role: "WORKER",
      status: "ACTIVE",
    });

    // 3. Create Worker Profiles
    console.log("Creating Worker Profiles...");
    const worker1 = await Worker.create({
      user_id: workerUser1._id,
      employee_code: "WRK001",
      worker_role: "Maintenance Worker",
      availability_status: "ACTIVE",
      shift: "Day Shift (08:00 AM - 05:00 PM)",
      zone: "Zone 2 - Gandhipuram Central",
      emergency_contact: "9876543219",
      address: "42 Cross Road, Gandhipuram, Coimbatore - 641012",
      skills: [
        "Footpath Tile Paving",
        "Concrete Crack Sealing",
        "Kerbstone Alignment",
        "Drainage Slab Repair",
        "Asphalt Patching",
      ],
      assigned_equipment: "Toolkit #T-104, Van #TN-38-AB-1234",
      rating: 4.9,
      on_time_rate: 96,
      joined_date: new Date("2025-01-12"),
    });

    const worker2 = await Worker.create({
      user_id: workerUser2._id,
      employee_code: "WRK002",
      worker_role: "Maintenance Worker",
      availability_status: "ACTIVE",
      shift: "Day Shift (08:00 AM - 05:00 PM)",
      zone: "Zone 1 - RS Puram",
      emergency_contact: "9876543220",
      address: "15 DB Road, RS Puram, Coimbatore",
      skills: ["Pothole Repair", "Kerbstone Alignment"],
      assigned_equipment: "Toolkit #T-105",
      rating: 4.7,
      on_time_rate: 92,
      joined_date: new Date("2025-02-25"),
    });

    const worker3 = await Worker.create({
      user_id: workerUser3._id,
      employee_code: "WRK003",
      worker_role: "Maintenance Worker",
      availability_status: "ACTIVE",
      shift: "Day Shift (08:00 AM - 05:00 PM)",
      zone: "Zone 3 - Peelamedu",
      emergency_contact: "9876543221",
      address: "88 Avinashi Road, Peelamedu, Coimbatore",
      skills: ["Footpath Tile Paving", "Drainage Slab Repair"],
      assigned_equipment: "Toolkit #T-106",
      rating: 4.8,
      on_time_rate: 94,
      joined_date: new Date("2025-03-18"),
    });

    const worker4 = await Worker.create({
      user_id: workerUser4._id,
      employee_code: "WRK004",
      worker_role: "Maintenance Worker",
      availability_status: "INACTIVE",
      shift: "Night Shift (10:00 PM - 06:00 AM)",
      zone: "Zone 4 - Town Hall",
      emergency_contact: "9876543222",
      address: "10 Oppanakara Street, Coimbatore",
      skills: ["Asphalt Patching"],
      assigned_equipment: "Toolkit #T-107",
      rating: 4.5,
      on_time_rate: 88,
      joined_date: new Date("2025-04-05"),
    });

    const worker5 = await Worker.create({
      user_id: workerUser5._id,
      employee_code: "WRK005",
      worker_role: "Maintenance Worker",
      availability_status: "ACTIVE",
      shift: "Day Shift (08:00 AM - 05:00 PM)",
      zone: "Zone 2 - Gandhipuram Central",
      emergency_contact: "9876543223",
      address: "100 Feet Road, Gandhipuram, Coimbatore",
      skills: ["Concrete Crack Sealing", "Kerbstone Alignment"],
      assigned_equipment: "Toolkit #T-108",
      rating: 4.8,
      on_time_rate: 95,
      joined_date: new Date("2025-05-22"),
    });

    const worker6 = await Worker.create({
      user_id: workerUser6._id,
      employee_code: "WRK006",
      worker_role: "Maintenance Worker",
      availability_status: "ACTIVE",
      shift: "Day Shift (08:00 AM - 05:00 PM)",
      zone: "Zone 5 - Saibaba Colony",
      emergency_contact: "9876543224",
      address: "4 NSR Road, Saibaba Colony, Coimbatore",
      skills: ["Footpath Tile Paving"],
      assigned_equipment: "Toolkit #T-109",
      rating: 4.6,
      on_time_rate: 90,
      joined_date: new Date("2025-06-10"),
    });

    // 4. Create Complaints
    console.log("Creating Complaints...");
    const cmp1 = await Complaint.create({
      complaint_code: "CMP001",
      reported_by: citizenArun._id,
      title: "Broken Footpath & Sunk Paver Blocks",
      description:
        "Multiple interlock tiles have broken and sunk inward creating a deep 8-inch tripping hazard for daily commuters.",
      issue_type: "BROKEN_FOOTPATH",
      priority: "HIGH",
      status: "IN_PROGRESS",
      location: "100 Feet Road, Gandhipuram, Coimbatore",
      landmark: "Opposite City Bus Stand Gate #2",
      area: "Gandhipuram",
      image_url:
        "https://images.unsplash.com/photo-1590496793929-36417d3117de?w=800&auto=format&fit=crop&q=80",
      latitude: 11.0168,
      longitude: 76.9558,
      reported_at: new Date("2026-08-21T09:15:00Z"),
    });

    const cmp2 = await Complaint.create({
      complaint_code: "CMP002",
      reported_by: citizenPriya._id,
      title: "Large Pothole on Sidewalk",
      description:
        "A large pothole has developed on the pedestrian pathway near the road junction. Water accumulates during rain.",
      issue_type: "POTHOLE",
      priority: "HIGH",
      status: "IN_PROGRESS",
      location: "DB Road, RS Puram, Coimbatore",
      landmark: "Near Post Office Junction",
      area: "RS Puram",
      image_url:
        "https://images.unsplash.com/photo-1517999349371-c43520457b23?w=800&auto=format&fit=crop&q=80",
      latitude: 11.0086,
      longitude: 76.9514,
      reported_at: new Date("2026-08-20T10:00:00Z"),
    });

    const cmp3 = await Complaint.create({
      complaint_code: "CMP003",
      reported_by: citizenKarthik._id,
      title: "Cracked Footpath",
      description:
        "Multiple cracks have appeared along the sidewalk. One section has become loose and may cause pedestrians to trip.",
      issue_type: "CRACK",
      priority: "MEDIUM",
      status: "RESOLVED",
      location: "Market Street, Saibaba Colony, Coimbatore",
      landmark: "Near Daily Market Arch",
      area: "Saibaba Colony",
      image_url:
        "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=800&auto=format&fit=crop&q=80",
      latitude: 11.0289,
      longitude: 76.9429,
      reported_at: new Date("2026-08-15T08:30:00Z"),
      resolved_at: new Date("2026-08-18T16:00:00Z"),
    });

    const cmp4 = await Complaint.create({
      complaint_code: "CMP004",
      reported_by: citizenKarthik._id,
      title: "Deep Sidewalk Cavity & Exposed Rebar",
      description:
        "Monsoon runoff has caused concrete curb detachment with sharp exposed reinforcement iron bars threatening school children.",
      issue_type: "DAMAGED_PAVEMENT",
      priority: "HIGH",
      status: "ASSIGNED",
      location: "Cross Cut Road, RS Puram, Coimbatore",
      landmark: "Near Municipal Primary School Crossing",
      area: "RS Puram",
      image_url:
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80",
      latitude: 11.0142,
      longitude: 76.9634,
      reported_at: new Date("2026-08-23T16:20:00Z"),
    });

    const cmp5 = await Complaint.create({
      complaint_code: "CMP005",
      reported_by: citizenArun._id,
      title: "Missing Footpath Tiles",
      description:
        "Several tiles are missing from the footpath near the shopping area. The exposed surface is dangerous for pedestrians.",
      issue_type: "MISSING_TILES",
      priority: "MEDIUM",
      status: "PENDING",
      location: "Trichy Road, Singanallur, Coimbatore",
      landmark: "Near Shopping Complex",
      area: "Singanallur",
      image_url:
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80",
      latitude: 10.9995,
      longitude: 77.0125,
      reported_at: new Date("2026-08-17T11:00:00Z"),
    });

    const cmp7 = await Complaint.create({
      complaint_code: "CMP007",
      reported_by: citizenPriya._id,
      title: "Uneven Kerbstone & Curb Ramp Damage",
      description:
        "Wheelchair ramp curb stones are tilted outwards and cracked, obstructing disabled pedestrians and senior citizens.",
      issue_type: "BROKEN_SIDEWALK",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      location: "Avinashi Road, Peelamedu, Coimbatore",
      landmark: "In front of PSG College Main Gate",
      area: "Peelamedu",
      image_url:
        "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80",
      latitude: 11.0267,
      longitude: 77.0028,
      reported_at: new Date("2026-08-20T14:10:00Z"),
    });

    const cmp9 = await Complaint.create({
      complaint_code: "CMP009",
      reported_by: citizenKarthik._id,
      title: "Loose Tactile Paving & Moss Slipping Hazard",
      description:
        "Yellow directional tactile pavers for visually impaired pedestrians have detached and moss buildup causes slipping.",
      issue_type: "OTHER",
      priority: "LOW",
      status: "ASSIGNED",
      location: "Race Course Road, Coimbatore",
      landmark: "Walking Track Gate #4",
      area: "Race Course",
      image_url:
        "https://images.unsplash.com/photo-1508873696983-2df5703bc20d?w=800&auto=format&fit=crop&q=80",
      latitude: 11.0024,
      longitude: 76.9742,
      reported_at: new Date("2026-08-24T11:30:00Z"),
    });

    const cmp12 = await Complaint.create({
      complaint_code: "CMP012",
      reported_by: citizenArun._id,
      title: "Cracked Walkway Slab & Storm Drain Gap",
      description:
        "Broken slab perimeter over storm water drain opening causing safety hazard for nighttime pedestrians.",
      issue_type: "DRAINAGE_DAMAGE",
      priority: "MEDIUM",
      status: "RESOLVED",
      location: "Town Hall Main Road, Coimbatore",
      landmark: "Near Clock Tower Roundabout",
      area: "Town Hall",
      image_url:
        "https://images.unsplash.com/photo-1584463699039-389eb325a74e?w=800&auto=format&fit=crop&q=80",
      latitude: 10.9961,
      longitude: 76.9619,
      reported_at: new Date("2026-08-18T15:00:00Z"),
      resolved_at: new Date("2026-08-20T16:30:00Z"),
    });

    // 4.1 Create Complaint Images
    console.log("Creating Complaint Images...");
    await ComplaintImage.create([
      {
        complaint_id: cmp1._id,
        image_url: cmp1.image_url,
        image_type: "BEFORE",
        uploaded_by: citizenArun._id,
        uploaded_at: cmp1.reported_at,
      },
      {
        complaint_id: cmp2._id,
        image_url: cmp2.image_url,
        image_type: "BEFORE",
        uploaded_by: citizenPriya._id,
        uploaded_at: cmp2.reported_at,
      },
      {
        complaint_id: cmp3._id,
        image_url: cmp3.image_url,
        image_type: "BEFORE",
        uploaded_by: citizenKarthik._id,
        uploaded_at: cmp3.reported_at,
      },
      {
        complaint_id: cmp4._id,
        image_url: cmp4.image_url,
        image_type: "BEFORE",
        uploaded_by: citizenKarthik._id,
        uploaded_at: cmp4.reported_at,
      },
      {
        complaint_id: cmp5._id,
        image_url: cmp5.image_url,
        image_type: "BEFORE",
        uploaded_by: citizenArun._id,
        uploaded_at: cmp5.reported_at,
      },
      {
        complaint_id: cmp7._id,
        image_url: cmp7.image_url,
        image_type: "BEFORE",
        uploaded_by: citizenPriya._id,
        uploaded_at: cmp7.reported_at,
      },
      {
        complaint_id: cmp9._id,
        image_url: cmp9.image_url,
        image_type: "BEFORE",
        uploaded_by: citizenKarthik._id,
        uploaded_at: cmp9.reported_at,
      },
      {
        complaint_id: cmp12._id,
        image_url: cmp12.image_url,
        image_type: "BEFORE",
        uploaded_by: citizenArun._id,
        uploaded_at: cmp12.reported_at,
      },
      {
        complaint_id: cmp12._id,
        image_url:
          "https://images.unsplash.com/photo-1590496793929-36417d3117de?w=800&auto=format&fit=crop&q=80",
        image_type: "AFTER",
        uploaded_by: workerUser1._id,
        uploaded_at: new Date("2026-08-20T16:30:00Z"),
      },
    ]);

    // 5. Create Assignments
    console.log("Creating Task Assignments...");
    await Assignment.create({
      complaint_id: cmp1._id,
      worker_id: worker1._id,
      assigned_by: managerUser._id,
      assigned_at: new Date("2026-08-22T10:00:00Z"),
      started_at: new Date("2026-08-22T11:30:00Z"),
      status: "IN_PROGRESS",
      remarks: "High priority pedestrian corridor. Cones placed.",
    });

    await Assignment.create({
      complaint_id: cmp2._id,
      worker_id: worker4._id,
      assigned_by: managerUser._id,
      assigned_at: new Date("2026-08-20T12:00:00Z"),
      started_at: new Date("2026-08-21T09:00:00Z"),
      status: "IN_PROGRESS",
      remarks: "Drain water pumped out. Filling aggregate.",
    });

    await Assignment.create({
      complaint_id: cmp4._id,
      worker_id: worker1._id,
      assigned_by: managerUser._id,
      assigned_at: new Date("2026-08-24T09:00:00Z"),
      status: "ASSIGNED",
      remarks: "Urgent: Near primary school.",
    });

    await Assignment.create({
      complaint_id: cmp7._id,
      worker_id: worker1._id,
      assigned_by: managerUser._id,
      assigned_at: new Date("2026-08-22T10:15:00Z"),
      started_at: new Date("2026-08-23T08:45:00Z"),
      status: "IN_PROGRESS",
      remarks: "Curb ramp realignment in progress.",
    });

    await Assignment.create({
      complaint_id: cmp9._id,
      worker_id: worker1._id,
      assigned_by: managerUser._id,
      assigned_at: new Date("2026-08-25T08:30:00Z"),
      status: "ASSIGNED",
      remarks: "Tactile pavers requisitioned from depot.",
    });

    await Assignment.create({
      complaint_id: cmp12._id,
      worker_id: worker1._id,
      assigned_by: managerUser._id,
      assigned_at: new Date("2026-08-19T09:30:00Z"),
      started_at: new Date("2026-08-19T11:00:00Z"),
      completed_at: new Date("2026-08-20T16:30:00Z"),
      status: "COMPLETED",
      remarks: "Drainage slab reset flush. Verified.",
    });

    // 6. Create Status History
    console.log("Creating Status Timeline History...");
    await StatusHistory.create([
      {
        complaint_id: cmp1._id,
        old_status: null,
        new_status: "PENDING",
        changed_by: citizenArun._id,
        remarks: "Complaint logged by citizen.",
        changed_at: new Date("2026-08-21T09:15:00Z"),
      },
      {
        complaint_id: cmp1._id,
        old_status: "PENDING",
        new_status: "ASSIGNED",
        changed_by: managerUser._id,
        remarks: "Assigned to Ravi Kumar (WRK001) by Field Manager.",
        changed_at: new Date("2026-08-22T10:00:00Z"),
      },
      {
        complaint_id: cmp1._id,
        old_status: "ASSIGNED",
        new_status: "IN_PROGRESS",
        changed_by: workerUser1._id,
        remarks: "Work started on site by Ravi Kumar.",
        changed_at: new Date("2026-08-22T11:30:00Z"),
      },
      {
        complaint_id: cmp12._id,
        old_status: "IN_PROGRESS",
        new_status: "RESOLVED",
        changed_by: workerUser1._id,
        remarks: "Marked work completed by Ravi Kumar. Submitted for manager verification.",
        changed_at: new Date("2026-08-20T16:30:00Z"),
      },
    ]);

    // 7. Create Repair History & Work Logs
    console.log("Creating Repair Logs...");
    await RepairHistory.create([
      {
        complaint_id: cmp1._id,
        worker_id: worker1._id,
        started_at: new Date("2026-08-22T11:30:00Z"),
        repair_description:
          "Excavated loose tiles, compacted 4 inches of aggregate sub-base, and preparing to lay new interlocking pavers.",
        materials_used: [
          "15 Heavy-duty Paver Blocks",
          "1 Bag Portland Cement",
          "Coarse Sand",
        ],
        before_image: cmp1.image_url,
        remarks: "Pedestrian safety cones and caution tape positioned around work zone.",
      },
      {
        complaint_id: cmp12._id,
        worker_id: worker1._id,
        started_at: new Date("2026-08-19T11:00:00Z"),
        completed_at: new Date("2026-08-20T16:30:00Z"),
        repair_description:
          "Reconstructed broken slab perimeter with quick-drying high-strength concrete. Reset drainage metal grate flush with pavement level.",
        materials_used: [
          "M30 Ready-mix Concrete",
          "2 Steel Rebar rods",
          "Bitumen Joint Sealant",
        ],
        before_image: cmp12.image_url,
        after_image:
          "https://images.unsplash.com/photo-1590496793929-36417d3117de?w=800&auto=format&fit=crop&q=80",
        repair_cost: 3200,
        remarks: "Work successfully completed. Verified surface flushness and drainage clearance.",
        verified_by: managerUser._id,
        verified_at: new Date("2026-08-21T10:00:00Z"),
      },
    ]);

    // 8. Create Notifications
    console.log("Creating Notifications...");
    await Notification.create([
      {
        user_id: workerUser1._id,
        complaint_id: cmp4._id,
        type: "ASSIGNMENT",
        message:
          "Manager Mohan Kumar assigned you CMP004 (Deep Sidewalk Cavity & Exposed Rebar at Cross Cut Road).",
        is_read: false,
        created_at: new Date(Date.now() - 2 * 3600 * 1000),
      },
      {
        user_id: workerUser1._id,
        complaint_id: cmp9._id,
        type: "ASSIGNMENT",
        message:
          "You have been assigned to repair loose tactile paving at Race Course Road (CMP009).",
        is_read: false,
        created_at: new Date(Date.now() - 5 * 3600 * 1000),
      },
      {
        user_id: workerUser1._id,
        complaint_id: cmp12._id,
        type: "STATUS_CHANGE",
        message:
          "Your completed repair on Town Hall Main Road (CMP012) has been received and verified by field manager.",
        is_read: true,
        created_at: new Date(Date.now() - 24 * 3600 * 1000),
      },
      {
        user_id: workerUser1._id,
        complaint_id: cmp1._id,
        type: "SYSTEM",
        message:
          "Weekly Maintenance Material Restock: Cement bags, safety cones, and new tamper tools are available for collection at Central Depot #3.",
        is_read: true,
        created_at: new Date(Date.now() - 48 * 3600 * 1000),
      },
    ]);

    console.log("=========================================");
    console.log("✅ Seed Data Inserted Successfully!");
    console.log("=========================================");
    console.log("Sample Login Credentials:");
    console.log("-----------------------------------------");
    console.log("Manager : mohan@gmail.com / password123");
    console.log("Worker  : ravi@gmail.com / password123 (WRK001)");
    console.log("Citizen : karthik.raja@example.com / password123");
    console.log("=========================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
