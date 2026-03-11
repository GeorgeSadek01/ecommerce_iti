const Router = require('express').Router;
const productController = require('./product.controller.js');
const productImageController = require('./productImage.controller.js');
const checkProductExists = require('./checkProductExists.js');
const uploadImages=require('./checkImage.js');
const { validateProductSearch, handleValidationErrors } = require('./Validators/products.validators.js');
const router = Router();
// CRUD routes for products
router.route('/' )
.post(productController.create)
.get(productController.getAll)

// Search should come before anything that might interpret 'search' as an ID
router.route('/search')
.get(validateProductSearch, handleValidationErrors, productController.search)

// Routes for specific product operations (get, update, delete)
router.route('/:id')
.get(checkProductExists, productController.getOne)
.patch(checkProductExists, productController.update)
.delete(checkProductExists, productController.delete);

//product images routes
router.route('/:id/images')
	.post(checkProductExists,uploadImages, productImageController.uploadProductImages)
	.get(checkProductExists, productImageController.getProductImages);
// Reorder images route
router.route('/:id/images/order')
	.patch(checkProductExists,productImageController.reorderImages);
// Delete specific image route
router.route('/:id/images/:imageId')
	.delete(checkProductExists,productImageController.deleteImage)
// Set primary image route
router.route('/:id/images/:imageId/primary')
	.patch(checkProductExists, productImageController.setPrimaryImage);

module.exports = router;