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
.patch(checkProductExists, productController.update)
.delete(checkProductExists, productController.delete);

//product images routes
router.route('/:id/images')
	.post(checkProductExists,uploadImages, productImageController.uploadProductImages)
	.get(checkProductExists, productImageController.getProductImages);

router.route('/:id/images/order')
	.patch(productImageController.reorderImages);

router.route('/:id/images/:imageId')
	.delete(productImageController.deleteImage)

router.route('/:id/images/:imageId/primary')
	.patch(productImageController.setPrimaryImage);
module.exports = router;