import Banner from '../../../core/db/Models/Marketing/banner.model.js';

const serializeBanner = (banner) => ({
  id: banner._id,
  title: banner.title,
  imageUrl: banner.imageUrl,
  linkUrl: banner.linkUrl,
  sortOrder: banner.sortOrder,
  isActive: banner.isActive,
  startsAt: banner.startsAt,
  endsAt: banner.endsAt,
});

export const getPublicBanners = async ({ limit = 10 } = {}) => {
  const now = new Date();

  const parsedLimit = Number.parseInt(String(limit), 10);
  const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 50) : 10;

  const filters = {
    isActive: true,
    $and: [
      {
        $or: [{ startsAt: null }, { startsAt: { $exists: false } }, { startsAt: { $lte: now } }],
      },
      {
        $or: [{ endsAt: null }, { endsAt: { $exists: false } }, { endsAt: { $gte: now } }],
      },
    ],
  };

  const banners = await Banner.find(filters).sort({ sortOrder: 1, createdAt: -1 }).limit(safeLimit);

  return banners.map(serializeBanner);
};
