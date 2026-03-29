import asyncHandler from '../../../core/utils/asyncHandler.js';
import { sendSuccess } from '../../../core/utils/apiResponse.js';
import { getPublicBanners } from '../services/banner.service.js';

export const getBannersHandler = asyncHandler(async (req, res) => {
  const banners = await getPublicBanners({ limit: req.query.limit });
  sendSuccess(res, 200, 'Banners retrieved successfully.', { banners });
});
