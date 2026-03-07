// import Category from "../../core/db/Models/Product/category.model.js";
// import slugify from "slugify";
const { get } = require("node:http");
const Category = require("../../core/db/Models/Product/category.model.js");
const slugify = require("slugify");

//Category CRUD (Admin)
module.exports = {
  //create category with slug generation and parent category handling
  create: async (data) => {
  // 1. Generate the slug (Logic!)
    const slug = slugify(data.name, { lower: true });
    let ancestors = [];
      // 2. Business Rule: Check if parent exists if parentId is provided
    if (data.parentId) {
      const parent = await Category.findById(data.parentId);
      if (!parent) throw new Error("Parent category not found");
      ancestors = [...parent.ancestors, parent._id]; // Inherit ancestors from parent + add parent itself
    }
    // 3. Save to DB
    const category = new Category({ ...data, slug, ancestors });
    return await category.save();
},
  //get all categories with parent name (for admin listing)
  getAll: async () => {
    return await Category.find().populate('parentId', 'name');
  },
  getById: async (id) => {
    return await Category.findById(id).populate('parentId', 'name');
  },
  //update category with slug regeneration if name changes
  update: async (id, data) => {
    if (data.name) {
      data.slug = slugify(data.name, { lower: true });
    }
    return await Category.findByIdAndUpdate(id, data, { new: true });
  },

  //delete category (consider cascading or reassigning children in a real app)
  delete: async (id) => {
    await Category.findByIdAndDelete(id);// 1. Delete the category itself
    await Category.deleteMany({ ancestors: id });// 2. Delete all descendants (children, grandchildren, etc.)
    return true;
  }
};