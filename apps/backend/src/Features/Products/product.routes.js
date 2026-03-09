const Router = require('express').Router;
const productController = require('./product.controller.js');
const productImageController = require('./productImage.controller.js');
const checkProductExists = require('./checkProductExists.js');
const uploadImages=require('./checkImage.js');
const router = Router();

router.route('/' )
.post(productController.create)
.get(productController.getAll)

router.route('/:id')
.get(checkProductExists, productController.getOne)
.put(checkProductExists, productController.update)
.delete(checkProductExists, productController.delete);

router.route('/:productId/images')
.post(uploadImages, productImageController.uploadProductImages)

module.exports = router;