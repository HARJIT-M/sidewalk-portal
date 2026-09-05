const { Notification } = require("../schemas");

// ==========================================
// 1. GET WORKER NOTIFICATIONS
// ==========================================
const getWorkerNotifications = async (req, res) => {
  try {
    // 1. Query notifications specifically assigned to this user
    let notifs = await Notification.find({ user_id: req.user._id })
      .populate("complaint_id", "complaint_code title")
      .sort({ created_at: -1, createdAt: -1 });

    // 2. If user is a MANAGER or test account with no specific notifications,
    // fallback to general/worker notifications so list is never empty
    if (!notifs || notifs.length === 0) {
      notifs = await Notification.find()
        .populate("complaint_id", "complaint_code title")
        .sort({ created_at: -1, createdAt: -1 });
    }

    const formattedNotifs = notifs.map((n) => {
      let timeAgo = "Recently";
      const dateToUse = n.created_at || n.createdAt;
      if (dateToUse) {
        const diffMs = Date.now() - new Date(dateToUse).getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 1) timeAgo = "Just now";
        else if (diffHours < 24)
          timeAgo = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        else {
          const diffDays = Math.floor(diffHours / 24);
          timeAgo = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
        }
      }

      let title = "Notification";
      if (n.type === "ASSIGNMENT") title = "New Task Assigned";
      else if (n.type === "STATUS_CHANGE") title = "Status Update";
      else if (n.type === "REPAIR_COMPLETED") title = "Repair Submitted";
      else if (n.type === "SYSTEM") title = "System Announcement";

      return {
        id: n._id.toString(),
        type: n.type,
        title,
        message: n.message,
        complaintId: n.complaint_id ? n.complaint_id.complaint_code : null,
        time: timeAgo,
        read: Boolean(n.is_read),
        urgent: Boolean(n.type === "ASSIGNMENT" && n.message && (n.message.includes("Urgent") || n.message.includes("Cavity"))),
      };
    });

    const unreadCount = formattedNotifs.filter((n) => !n.read).length;

    return res.status(200).json({
      success: true,
      count: formattedNotifs.length,
      unreadCount,
      notifications: formattedNotifs,
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
};

// ==========================================
// 2. MARK NOTIFICATION AS READ
// ==========================================
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { is_read: true });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error("Error marking notification read:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read.",
      error: error.message,
    });
  }
};

// ==========================================
// 3. MARK ALL NOTIFICATIONS AS READ
// ==========================================
const markAllNotificationsRead = async (req, res) => {
  try {
    const filter = req.user?.role === "MANAGER" ? {} : { user_id: req.user._id };
    await Notification.updateMany(filter, { is_read: true });

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Error marking all notifications read:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications read.",
      error: error.message,
    });
  }
};

// ==========================================
// 4. DELETE NOTIFICATION
// ==========================================
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Notification deleted.",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete notification.",
      error: error.message,
    });
  }
};

module.exports = {
  getWorkerNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};
