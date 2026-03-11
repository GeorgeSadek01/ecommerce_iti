const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');

//////////////////  this will be deleted later after authentication /////////////////////////
router.use((req, res, next) => {
  req.user = {
    id: '69b1441d7be0e89a7b92491b',
  };
  next();
});

router.route('/').get(cartController.getCart);

router.route('/items').post(cartController.addItemToCart);

router.route('/items/:id').patch(cartController.updateCartItem).delete(cartController.removeCartItem);

module.exports = router;
