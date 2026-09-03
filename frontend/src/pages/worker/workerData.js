// Initial sample dataset for the Worker Role (WRK001 - Ravi Kumar)

export const initialWorkerProfile = {
  id: "WRK001",
  name: "Ravi Kumar",
  phone: "9876543210",
  email: "ravi@gmail.com",
  role: "Maintenance Worker",
  status: "Active",
  shift: "Day Shift (08:00 AM - 05:00 PM)",
  joinedDate: "12 Jan 2025",
  zone: "Zone 2 - Gandhipuram Central",
  emergencyContact: "9876543219",
  address: "42 Cross Road, Gandhipuram, Coimbatore - 641012",
  skills: [
    "Footpath Tile Paving",
    "Concrete Crack Sealing",
    "Kerbstone Alignment",
    "Drainage Slab Repair",
    "Asphalt Patching"
  ],
  assignedEquipment: "Toolkit #T-104, Van #TN-38-AB-1234",
  stats: {
    totalAssigned: 5,
    inProgress: 2,
    pending: 2,
    completed: 1,
    rating: 4.9,
    onTimeRate: 96
  }
};

export const initialAssignedComplaints = [
  {
    id: "CMP001",
    issue: "Broken Footpath & Sunk Paver Blocks",
    location: "100 Feet Road, Gandhipuram, Coimbatore",
    landmark: "Opposite City Bus Stand Gate #2",
    description: "Multiple interlock tiles have broken and sunk inward creating a deep 8-inch tripping hazard for daily commuters.",
    priority: "HIGH",
    status: "IN_PROGRESS",
    reportedDate: "21 Aug 2026",
    assignedDate: "22 Aug 2026",
    reporterName: "Citizen #4829",
    reportedImage: "https://images.unsplash.com/photo-1590496793929-36417d3117de?w=800&auto=format&fit=crop&q=80",
    completionImage: null,
    workDescription: "Excavated loose tiles, compacted 4 inches of aggregate sub-base, and preparing to lay new interlocking pavers.",
    materialsUsed: "15 Heavy-duty Paver Blocks, 1 Bag Portland Cement, Coarse Sand",
    remarks: "Pedestrian safety cones and caution tape positioned around work zone.",
    estimatedHours: "4 Hours",
    statusHistory: [
      { status: "REPORTED", date: "21 Aug 2026, 09:15 AM", note: "Complaint logged by citizen." },
      { status: "ASSIGNED", date: "22 Aug 2026, 10:00 AM", note: "Assigned to Ravi Kumar (WRK001) by Field Manager." },
      { status: "IN_PROGRESS", date: "22 Aug 2026, 11:30 AM", note: "Work started on site by Ravi Kumar." }
    ],
    repairHistory: [
      { time: "22 Aug 2026, 11:30 AM", action: "Site inspection completed, hazard area barricaded." },
      { time: "22 Aug 2026, 02:15 PM", action: "Removed fractured pavers and cleared drainage grit." }
    ]
  },
  {
    id: "CMP004",
    issue: "Deep Sidewalk Cavity & Exposed Rebar",
    location: "Cross Cut Road, RS Puram, Coimbatore",
    landmark: "Near Municipal Primary School Crossing",
    description: "Monsoon runoff has caused concrete curb detachment with sharp exposed reinforcement iron bars threatening school children.",
    priority: "HIGH",
    status: "ASSIGNED",
    reportedDate: "23 Aug 2026",
    assignedDate: "24 Aug 2026",
    reporterName: "Citizen #1092",
    reportedImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80",
    completionImage: null,
    workDescription: "",
    materialsUsed: "",
    remarks: "",
    estimatedHours: "6 Hours",
    statusHistory: [
      { status: "REPORTED", date: "23 Aug 2026, 04:20 PM", note: "Urgent citizen hazard report registered." },
      { status: "ASSIGNED", date: "24 Aug 2026, 09:00 AM", note: "Assigned with high priority to Ravi Kumar." }
    ],
    repairHistory: []
  },
  {
    id: "CMP007",
    issue: "Uneven Kerbstone & Curb Ramp Damage",
    location: "Avinashi Road, Peelamedu, Coimbatore",
    landmark: "In front of PSG College Main Gate",
    description: "Wheelchair ramp curb stones are tilted outwards and cracked, obstructing disabled pedestrians and senior citizens.",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    reportedDate: "20 Aug 2026",
    assignedDate: "22 Aug 2026",
    reporterName: "Citizen #8841",
    reportedImage: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80",
    completionImage: null,
    workDescription: "Realigned concrete curb blocks and applied high-strength bonding adhesive.",
    materialsUsed: "Quick-setting Polymer Mortar, 3 Pre-cast Curb Blocks",
    remarks: "Mortar currently curing. Need to apply textured anti-skid sealant.",
    estimatedHours: "3 Hours",
    statusHistory: [
      { status: "REPORTED", date: "20 Aug 2026, 02:10 PM", note: "Reported via mobile portal." },
      { status: "ASSIGNED", date: "22 Aug 2026, 10:15 AM", note: "Assigned to Ravi Kumar." },
      { status: "IN_PROGRESS", date: "23 Aug 2026, 08:45 AM", note: "Repair work underway." }
    ],
    repairHistory: [
      { time: "23 Aug 2026, 08:45 AM", action: "Disassembled broken curb stones and cleared loose gravel." },
      { time: "23 Aug 2026, 11:30 AM", action: "Realigned blocks and applied polymer mortar." }
    ]
  },
  {
    id: "CMP009",
    issue: "Loose Tactile Paving & Moss Slipping Hazard",
    location: "Race Course Road, Coimbatore",
    landmark: "Walking Track Gate #4",
    description: "Yellow directional tactile pavers for visually impaired pedestrians have detached and moss buildup causes slipping.",
    priority: "LOW",
    status: "ASSIGNED",
    reportedDate: "24 Aug 2026",
    assignedDate: "25 Aug 2026",
    reporterName: "Citizen #2910",
    reportedImage: "https://images.unsplash.com/photo-1508873696983-2df5703bc20d?w=800&auto=format&fit=crop&q=80",
    completionImage: null,
    workDescription: "",
    materialsUsed: "",
    remarks: "",
    estimatedHours: "2 Hours",
    statusHistory: [
      { status: "REPORTED", date: "24 Aug 2026, 11:30 AM", note: "Reported by morning walker." },
      { status: "ASSIGNED", date: "25 Aug 2026, 08:30 AM", note: "Assigned to Ravi Kumar." }
    ],
    repairHistory: []
  },
  {
    id: "CMP012",
    issue: "Cracked Walkway Slab & Storm Drain Gap",
    location: "Town Hall Main Road, Coimbatore",
    landmark: "Near Clock Tower Roundabout",
    description: "Broken slab perimeter over storm water drain opening causing safety hazard for nighttime pedestrians.",
    priority: "MEDIUM",
    status: "RESOLVED",
    reportedDate: "18 Aug 2026",
    assignedDate: "19 Aug 2026",
    reporterName: "Citizen #3124",
    reportedImage: "https://images.unsplash.com/photo-1584463699039-389eb325a74e?w=800&auto=format&fit=crop&q=80",
    completionImage: "https://images.unsplash.com/photo-1590496793929-36417d3117de?w=800&auto=format&fit=crop&q=80",
    workDescription: "Reconstructed broken slab perimeter with quick-drying high-strength concrete. Reset drainage metal grate flush with pavement level.",
    materialsUsed: "M30 Ready-mix Concrete, 2 Steel Rebar rods, Bitumen Joint Sealant",
    remarks: "Work successfully completed. Verified surface flushness and drainage clearance. Awaiting manager inspection.",
    estimatedHours: "5 Hours",
    statusHistory: [
      { status: "REPORTED", date: "18 Aug 2026, 03:00 PM", note: "Complaint logged." },
      { status: "ASSIGNED", date: "19 Aug 2026, 09:30 AM", note: "Assigned to Ravi Kumar." },
      { status: "IN_PROGRESS", date: "19 Aug 2026, 11:00 AM", note: "Work initiated." },
      { status: "RESOLVED", date: "20 Aug 2026, 04:30 PM", note: "Marked work completed by Ravi Kumar. Submitted for manager verification." }
    ],
    repairHistory: [
      { time: "19 Aug 2026, 11:00 AM", action: "Chipped off broken concrete and reinforced edge frame." },
      { time: "20 Aug 2026, 01:30 PM", action: "Poured M30 concrete mix and smoothed edges." },
      { time: "20 Aug 2026, 04:30 PM", action: "Uploaded completion photos and finalized work log." }
    ]
  }
];

export const initialNotifications = [
  {
    id: "NOTIF-01",
    type: "ASSIGNMENT",
    title: "New High Priority Task Assigned",
    message: "Manager Harjit assigned you CMP004 (Deep Sidewalk Cavity & Exposed Rebar at Cross Cut Road).",
    complaintId: "CMP004",
    time: "2 hours ago",
    read: false,
    urgent: true
  },
  {
    id: "NOTIF-02",
    type: "ASSIGNMENT",
    title: "Task Assigned: CMP009",
    message: "You have been assigned to repair loose tactile paving at Race Course Road.",
    complaintId: "CMP009",
    time: "5 hours ago",
    read: false,
    urgent: false
  },
  {
    id: "NOTIF-03",
    type: "STATUS_UPDATE",
    title: "Review Pending for CMP012",
    message: "Your completed repair on Town Hall Main Road has been received and queued for field manager verification.",
    complaintId: "CMP012",
    time: "1 day ago",
    read: true,
    urgent: false
  },
  {
    id: "NOTIF-04",
    type: "SYSTEM",
    title: "Weekly Maintenance Material Restock",
    message: "Cement bags, safety cones, and new tamper tools are available for collection at Central Depot #3.",
    time: "2 days ago",
    read: true,
    urgent: false
  }
];

// LocalStorage helpers
export const getStoredComplaints = () => {
  const data = localStorage.getItem("worker_assigned_complaints");
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return initialAssignedComplaints;
    }
  }
  localStorage.setItem("worker_assigned_complaints", JSON.stringify(initialAssignedComplaints));
  return initialAssignedComplaints;
};

export const saveStoredComplaints = (complaints) => {
  localStorage.setItem("worker_assigned_complaints", JSON.stringify(complaints));
};

export const getStoredProfile = () => {
  const data = localStorage.getItem("worker_profile_data");
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return initialWorkerProfile;
    }
  }
  localStorage.setItem("worker_profile_data", JSON.stringify(initialWorkerProfile));
  return initialWorkerProfile;
};

export const saveStoredProfile = (profile) => {
  localStorage.setItem("worker_profile_data", JSON.stringify(profile));
};

export const getStoredNotifications = () => {
  const data = localStorage.getItem("worker_notifications");
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return initialNotifications;
    }
  }
  localStorage.setItem("worker_notifications", JSON.stringify(initialNotifications));
  return initialNotifications;
};

export const saveStoredNotifications = (notifs) => {
  localStorage.setItem("worker_notifications", JSON.stringify(notifs));
};
