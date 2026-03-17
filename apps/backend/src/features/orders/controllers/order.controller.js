import asyncHandler from '../../../core/utils/asyncHandler.js';
import { sendSuccess, sendFail } from '../../../core/utils/apiResponse.js';
import * as orderService from '../services/order.service.js';

export const placeOrder = asyncHandler(async (req, res) => {
  const { addressId, promoCode } = req.body;
  const order = await orderService.placeOrder(req.user.id, addressId, promoCode);
  sendSuccess(res, 201, 'Order placed successfully', { order });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await orderService.getAllOrders({ status, page, limit });
  sendSuccess(res, 200, 'Orders fetched successfully', result);
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.user.id, req.user.role);
  sendSuccess(res, 200, 'Order fetched successfully', { order });
});

export const getUserOrders = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await orderService.getOrdersByUser(req.params.id, req.user.id, req.user.role, { status, page, limit });
  sendSuccess(res, 200, 'User orders fetched successfully', result);
});

export const getMyOrders = asyncHandler(async (req, res) => {
  console.log('plapla');
  console.log('my orders');
  console.log(req);
  const { status, page, limit } = req.query;
  if (req.user.role == 'admin') sendFail(res, 404, 'Admins cannot have orders');
  console.log('passed');
  const result = await orderService.getOrdersByUser(req.user.id, req.user.id, req.user.role, { status, page, limit });
  sendSuccess(res, 200, 'Your orders fetched successfully', result);
});

export const updateOrder = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrder(req.params.id, req.body);
  sendSuccess(res, 200, 'Order updated successfully', { order });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id, req.user.id, req.user.role);
  sendSuccess(res, 200, 'Order cancelled successfully', { order });
});

export const confirmOrder = asyncHandler(async (req, res) => {
  const order = await orderService.confirmOrder(req.params.id);
  sendSuccess(res, 200, 'Order confirmed and shipped successfully', { order });
});
