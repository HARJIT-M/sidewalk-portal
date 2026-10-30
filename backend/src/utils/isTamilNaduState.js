const isTamilNaduState = (state) => {
  if (typeof state !== "string" || !state.trim()) return null;
  const normalizedState = state
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  return normalizedState === "tamilnadu";
};

module.exports = { isTamilNaduState };
