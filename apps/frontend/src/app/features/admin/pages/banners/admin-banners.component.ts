import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminBannerService } from '../../data-access/admin-banner.service';
import { AdminBanner } from '../../data-access/admin.types';

@Component({
  selector: 'app-admin-banners',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-banners.component.html',
  styleUrl: './admin-banners.component.css',
  host: { class: 'd-block' },
})
export class AdminBannersComponent implements OnInit {
  banners = signal<AdminBanner[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalPages = signal(1);

  // Modal for create/edit
  showModal = signal(false);
  isEditMode = signal(false);
  selectedBanner = signal<AdminBanner | null>(null);

  // Form fields
  formData = signal({
    imageUrl: '',
    redirectUrl: '',
    order: 0,
    isActive: true,
  });

  imageFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);

  // Drag-drop state
  draggedBannerId = signal<string | null>(null);

  constructor(private bannerService: AdminBannerService) {}

  ngOnInit(): void {
    this.loadBanners();
  }

  loadBanners(): void {
    this.loading.set(true);
    this.error.set(null);

    this.bannerService.getBanners(this.currentPage(), this.pageSize()).subscribe({
      next: (res) => {
        if (res.data?.items) {
          this.banners.set(res.data.items);
          if (res.data.meta) {
            this.totalPages.set(res.data.meta.pages);
          }
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load banners');
        this.loading.set(false);
      },
    });
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadBanners();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadBanners();
    }
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.resetFormData();
    this.showModal.set(true);
  }

  openEditModal(banner: AdminBanner): void {
    this.isEditMode.set(true);
    this.selectedBanner.set(banner);
    this.formData.set({
      imageUrl: banner.imageUrl,
      redirectUrl: banner.redirectUrl || '',
      order: banner.order,
      isActive: banner.isActive,
    });
    this.imagePreview.set(banner.imageUrl);
    this.imageFile.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.resetFormData();
  }

  resetFormData(): void {
    this.formData.set({
      imageUrl: '',
      redirectUrl: '',
      order: 0,
      isActive: true,
    });
    this.imageFile.set(null);
    this.imagePreview.set(null);
    this.selectedBanner.set(null);
  }

  onImageSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.imageFile.set(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  saveBanner(): void {
    const form = this.formData();

    // Validation
    if (!form.imageUrl && !this.imageFile()) {
      this.error.set('Image is required');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    if (this.isEditMode()) {
      // Update existing banner
      const bannerId = this.selectedBanner()?._id;
      if (!bannerId) return;

      const updateData: any = {
        imageUrl: form.imageUrl,
        redirectUrl: form.redirectUrl,
        order: form.order,
        isActive: form.isActive,
      };

      // Only update imageUrl if new image is selected
      if (this.imageFile()) {
        const formDataWithImage = new FormData();
        formDataWithImage.append('redirectUrl', form.redirectUrl);
        formDataWithImage.append('order', form.order.toString());
        formDataWithImage.append('isActive', form.isActive.toString());
        formDataWithImage.append('image', this.imageFile()!);

        this.bannerService.updateBanner(bannerId, formDataWithImage).subscribe({
          next: () => {
            this.loadBanners();
            this.closeModal();
          },
          error: () => {
            this.error.set('Failed to update banner');
            this.loading.set(false);
          },
        });
      } else {
        this.bannerService.updateBanner(bannerId, updateData).subscribe({
          next: () => {
            this.loadBanners();
            this.closeModal();
          },
          error: () => {
            this.error.set('Failed to update banner');
            this.loading.set(false);
          },
        });
      }
    } else {
      // Create new banner
      if (!this.imageFile()) {
        this.error.set('Image is required for new banners');
        this.loading.set(false);
        return;
      }

      const formDataWithImage = new FormData();
      formDataWithImage.append('redirectUrl', form.redirectUrl);
      formDataWithImage.append('order', form.order.toString());
      formDataWithImage.append('isActive', form.isActive.toString());
      formDataWithImage.append('image', this.imageFile()!);

      this.bannerService.createBanner(formDataWithImage).subscribe({
        next: () => {
          this.loadBanners();
          this.closeModal();
        },
        error: () => {
          this.error.set('Failed to create banner');
          this.loading.set(false);
        },
      });
    }
  }

  toggleActive(banner: AdminBanner): void {
    const updateData = {
      isActive: !banner.isActive,
    };

    this.bannerService.updateBanner(banner._id, updateData).subscribe({
      next: () => {
        banner.isActive = !banner.isActive;
        this.banners.update((banners) =>
          banners.map((b) => (b._id === banner._id ? { ...b, isActive: !b.isActive } : b))
        );
      },
      error: () => {
        this.error.set('Failed to toggle banner');
      },
    });
  }

  deleteBanner(bannerId: string): void {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    this.bannerService.deleteBanner(bannerId).subscribe({
      next: () => {
        this.banners.update((banners) => banners.filter((b) => b._id !== bannerId));
      },
      error: () => {
        this.error.set('Failed to delete banner');
      },
    });
  }

  // Drag-drop reordering methods
  onDragStart(bannerId: string): void {
    this.draggedBannerId.set(bannerId);
  }

  onDragOver(event: any): void {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  onDrop(targetBannerId: string): void {
    const draggedId = this.draggedBannerId();
    if (!draggedId || draggedId === targetBannerId) return;

    const draggedIndex = this.banners().findIndex((b) => b._id === draggedId);
    const targetIndex = this.banners().findIndex((b) => b._id === targetBannerId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Swap order in UI
    const updatedBanners = [...this.banners()];
    const temp = updatedBanners[draggedIndex];
    updatedBanners[draggedIndex] = updatedBanners[targetIndex];
    updatedBanners[targetIndex] = temp;

    this.banners.set(updatedBanners);

    // Update display order on backend
    const reorderData = updatedBanners.map((banner, index) => ({
      _id: banner._id,
      order: index,
    }));

    this.bannerService.reorderBanners(reorderData).subscribe({
      error: () => {
        this.error.set('Failed to reorder banners');
        this.loadBanners(); // Reload to sync with server
      },
    });

    this.draggedBannerId.set(null);
  }

  onDragEnd(): void {
    this.draggedBannerId.set(null);
  }
}
