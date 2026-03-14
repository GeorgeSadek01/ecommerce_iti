import { Router } from 'express';
import authenticate from '../../core/middlewares/authenticate.js';
import validateRequest from '../../core/middlewares/validateRequest.js';
import {
  createSellerProfileHandler,
  getSellerProfileHandler,
  updateSellerProfileHandler,
} from './Controllers/sellerProfile.controller.js';
import { createSellerProfileValidator, updateSellerProfileValidator } from './Validators/sellerProfile.validators.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /seller/profile:
 *   post:
 *     summary: Create a seller profile
 *     description: Create a new seller profile for the authenticated user. Changes user role to 'seller'.
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeName
 *             properties:
 *               storeName:
 *                 type: string
 *                 maxLength: 100
 *                 example: "My Awesome Store"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "We sell the best products"
 *               logoUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/logo.png"
 *     responses:
 *       201:
 *         description: Seller profile created successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       409:
 *         description: Seller profile already exists or store name taken
 */
router.post('/profile', createSellerProfileValidator, validateRequest, createSellerProfileHandler);

/**
 * @swagger
 * /seller/profile:
 *   get:
 *     summary: Get seller profile
 *     description: Retrieve the seller profile for the authenticated user
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller profile retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Seller profile not found
 */
router.get('/profile', getSellerProfileHandler);

/**
 * @swagger
 * /seller/profile:
 *   patch:
 *     summary: Update seller profile
 *     description: Update the seller profile for the authenticated user
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               storeName:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               logoUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Seller profile updated successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Seller profile not found
 *       409:
 *         description: Store name already taken
 */
router.patch('/profile', updateSellerProfileValidator, validateRequest, updateSellerProfileHandler);

export default router;
