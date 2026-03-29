import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminCategoryService } from '../../data-access/admin-category.service';
import { AdminCategory } from '../../data-access/admin.types';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.css',
})
export class AdminCategoriesComponent implements OnInit {
  categories = signal<AdminCategory[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  name = signal('');
  description = signal('');
  parentId = signal('');

  constructor(private readonly categoryService: AdminCategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.error.set(null);

    this.categoryService.getCategories().subscribe({
      next: (res) => {
        this.categories.set(res.data?.categories ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load categories');
        this.loading.set(false);
      },
    });
  }

  createCategory(): void {
    const categoryName = this.name().trim();
    if (!categoryName) {
      this.error.set('Category name is required.');
      return;
    }

    const parentId = this.parentId().trim();
    if (parentId && !/^[a-fA-F0-9]{24}$/.test(parentId)) {
      this.error.set('Parent category ID must be a valid 24-character Mongo ID.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.categoryService
      .createCategory({
        name: categoryName,
        description: this.description().trim() || undefined,
        parentId: parentId || null,
      })
      .subscribe({
        next: (res) => {
          const created = res.data?.category;
          if (created) {
            this.categories.update((existing) => [created, ...existing]);
          } else {
            this.loadCategories();
          }

          this.name.set('');
          this.description.set('');
          this.parentId.set('');
          this.success.set('Category created successfully.');
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to create category');
          this.loading.set(false);
        },
      });
  }
}
