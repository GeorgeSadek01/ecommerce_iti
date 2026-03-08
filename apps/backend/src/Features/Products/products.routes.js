const Router = require('express').Router;
const productController = require('./product.controller.js');
const checkProductExists = require('./checkProductExists.js');

const router = Router();

router.route('/' )
.post(productController.create)
.get(productController.getAll)

router.route('/:id')
.get(checkProductExists, productController.getOne)
.put(checkProductExists, productController.update)
.delete(checkProductExists, productController.delete);


module.exports = router;
