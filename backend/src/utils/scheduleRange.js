const parseScheduleRange = (startDate, endDate) => {
  const isDateOnly = (value) =>
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;

  if (!isDateOnly(startDate) || !isDateOnly(endDate)) return null;

  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T23:59:59.999Z`);
  if (end < start) return null;
  return { start, end };
};

const getBusyAssignmentsFilter = (start, end, excludedAssignmentId) => ({
  ...(excludedAssignmentId ? { _id: { $ne: excludedAssignmentId } } : {}),
  status: { $in: ["ASSIGNED", "IN_PROGRESS"] },
  $or: [
    {
      scheduled_start_at: { $lte: end },
      scheduled_end_at: { $gte: start },
    },
    {
      scheduled_start_at: { $exists: false },
      scheduled_end_at: { $exists: false },
      started_at: { $lte: end },
      completed_at: { $gte: start },
    },
    {
      scheduled_start_at: { $exists: false },
      scheduled_end_at: { $exists: false },
      $or: [
        { started_at: { $exists: false } },
        { completed_at: { $exists: false } },
      ],
    },
    {
      scheduled_start_at: { $exists: false },
      scheduled_end_at: { $exists: true },
    },
    {
      scheduled_start_at: { $exists: true },
      scheduled_end_at: { $exists: false },
    },
  ],
});

module.exports = { parseScheduleRange, getBusyAssignmentsFilter };
