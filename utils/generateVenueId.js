export const generateVenueId = (name) => {
  const cleanName = name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

  const year = new Date().getFullYear();

  const randomNumber = Math.floor(
    1000 + Math.random() * 9000
  );

  return `${cleanName}@${year}-${randomNumber}`;
};