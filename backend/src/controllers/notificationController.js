const { Notification } = require("../schemas");

// ==========================================
// 1. GET WORKER NOTIFICATIONS
// ==========================================
const getWorkerNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ user_id: req.user._id })
      .populate("complaint_id", "complaint_code title")
      .sort({ created_at: -1 });

    const formattedNotifs = notifs.map((n) => {
      let timeAgo = "Recently";
      if (n.created_at) {
        const diffMs = Date.now() - new Date(n.created_at).getTime();
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
        read: n.is_read,
        urgent: n.type === "ASSIGNMENT" && n.message.includes("Urgent"),
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedNotifs.length,
      unreadCount: formattedNotifs.filter((n) => !n.read).length,
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
// 2. MARK NOTIFICATION READ
// ==========================================
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { _id: id, user_id: req.user._id },
      { is_read: true }
    );

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
// 3. MARK ALL NOTIFICATIONS READ
// ==========================================
const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user_id: req.user._id, is_read: false },
      { is_read: true }
    );

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
    await Notification.findOneAndDelete({ _id: id, user_id: req.user._id });

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
