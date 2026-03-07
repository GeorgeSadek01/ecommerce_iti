// import Category from "../../core/db/Models/Product/category.model.js";
// import slugify from "slugify";
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
  updateDescendantsAncestors:async (id, newAncestors) => {
    const children = await Category.find({ parentId: parentId });
    
    for (const child of children) {
        const childNewAncestors = [...newAncestors, parentId];
        await Category.findByIdAndUpdate(child._id, { ancestors: childNewAncestors });
        // Recursively update this child's children
        await updateDescendantsAncestors(child._id, childNewAncestors);
    }
  },
  update: async (id, data) => {
// 1. Update slug if name is changed
    if (data.name) {
        data.slug = slugify(data.name, { lower: true });
    }
      // 2. Handle Parent Change
    if (data.parentId !== undefined) {
      if (data.parentId === id) {
          throw new Error("A category cannot be its own parent.");
      }
        // Logic to update ancestors based on the new parent
      if (data.parentId === null) {
          data.ancestors = [];
      } else {
          const parent = await Category.findById(data.parentId);
          if (!parent) throw new Error("Parent category not found.");
          
          data.ancestors = [...parent.ancestors, parent._id];
      }
        // 3. Update the category itself
      const updatedCategory = await Category.findByIdAndUpdate(id, data, {
          new: true,
          runValidators: true
      });
        // 4. Update all descendants' ancestors
      await updateDescendantsAncestors(id, data.ancestors);

      return updatedCategory;
    }
    return await Category.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
    });
  },
  //delete category (consider cascading or reassigning children in a real app)
  delete: async (id) => {
    await Category.findByIdAndDelete(id);// 1. Delete the category itself
    await Category.deleteMany({ ancestors: id });// 2. Delete all descendants (children, grandchildren, etc.)
    return true;
  }
};