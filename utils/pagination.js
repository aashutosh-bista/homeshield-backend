export const getPagination = (query) => {
  let { page = 1, limit = 10 } = query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Number(limit));

  const skip = (pageNum - 1) * limitNum;

  return { pageNum, limitNum, skip };
};
