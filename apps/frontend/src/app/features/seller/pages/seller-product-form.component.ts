import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';
import { SellerProductApiService } from '../data-access/seller-product-api.service';
import { SellerCategory, SellerProductImage } from '../data-access/seller.types';

interface PendingUploadImage {
  id: string;
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-seller-product-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './seller-product-form.component.html',
  styleUrl: './seller-product-form.component.css',
})
export class SellerProductFormComponent implements OnInit, OnDestroy {
  protected readonly isSubmitting = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly categories = signal<SellerCategory[]>([]);
  protected readonly images = signal<SellerProductImage[]>([]);
  protected readonly isImagesLoading = signal(false);
  protected readonly isUploadingImages = signal(false);
  protected readonly isDropZoneActive = signal(false);
  protected readonly pendingUploads = signal<PendingUploadImage[]>([]);
  protected readonly draggedPreviewId = signal<string | null>(null);
  protected readonly isDeleteModalOpen = signal(false);
  protected readonly pendingDeleteImageId = signal<string | null>(null);

  private productId: string | null = null;

  protected readonly isEditMode = computed(() => Boolean(this.productId));

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    discount: [0, [Validators.min(0), Validators.max(100)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    categoryId: ['', [Validators.required]],
    isActive: [true],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly sellerProductApi: SellerProductApiService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    this.loadCategories();

    if (this.productId) {
      this.loadProduct(this.productId);
      this.loadImages(this.productId);
    }
  }

  ngOnDestroy(): void {
    this.releasePendingPreviewUrls();
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    this.addPendingFiles(files);
    input.value = '';
  }

  protected onDropZoneDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDropZoneActive.set(true);
  }

  protected onDropZoneDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDropZoneActive.set(false);
  }

  protected onDropZoneDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDropZoneActive.set(false);

    const files = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
    this.addPendingFiles(files);
  }

  protected removePendingUpload(id: string): void {
    const queue = this.pendingUploads();
    const target = queue.find((item) => item.id === id);
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
    }
    this.pendingUploads.set(queue.filter((item) => item.id !== id));
  }

  protected clearPendingUploads(): void {
    this.releasePendingPreviewUrls();
    this.pendingUploads.set([]);
  }

  protected movePendingImage(fromIndex: number, toIndex: number): void {
    const queue = [...this.pendingUploads()];
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= queue.length || toIndex >= queue.length || fromIndex === toIndex) {
      return;
    }

    const [item] = queue.splice(fromIndex, 1);
    queue.splice(toIndex, 0, item);
    this.pendingUploads.set(queue);
  }

  protected moveImage(fromIndex: number, toIndex: number): void {
    const items = [...this.images()];
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length || fromIndex === toIndex) {
      return;
    }

    const [item] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, item);
    this.images.set(items);
  }

  protected onPreviewDragStart(id: string): void {
    this.draggedPreviewId.set(id);
  }

  protected onPreviewDrop(targetId: string): void {
    const sourceId = this.draggedPreviewId();
    this.draggedPreviewId.set(null);
    if (!sourceId || sourceId === targetId) return;

    const queue = this.pendingUploads();
    const fromIndex = queue.findIndex((item) => item.id === sourceId);
    const toIndex = queue.findIndex((item) => item.id === targetId);
    this.movePendingImage(fromIndex, toIndex);
  }

  protected onPreviewDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  protected uploadSelectedImages(): void {
    if (!this.productId) {
      this.toast.info('Create the product first before uploading images.');
      return;
    }

    const files = this.pendingUploads().map((item) => item.file);
    if (files.length === 0) {
      this.toast.info('Please choose one or more images first.');
      return;
    }

    this.isUploadingImages.set(true);

    this.sellerProductApi
      .uploadImages(this.productId, files)
      .pipe(finalize(() => this.isUploadingImages.set(false)))
      .subscribe({
        next: (response) => {
          this.toast.success(response.message || 'Images uploaded successfully.');
          this.clearPendingUploads();
          this.loadImages(this.productId as string);
        },
        error: (error: unknown) => {
          this.toast.error(extractApiErrorMessage(error, 'Failed to upload images.'));
        },
      });
  }

  protected makePrimary(imageId: string): void {
    if (!this.productId) return;

    const previousImages = this.images();
    this.images.update((items) =>
      items.map((item) => ({
        ...item,
        isPrimary: item._id === imageId,
      }))
    );

    this.sellerProductApi.setPrimaryImage(this.productId, imageId).subscribe({
      next: (response) => {
        this.toast.success(response.message || 'Primary image updated.');
      },
      error: (error: unknown) => {
        this.images.set(previousImages);
        this.toast.error(extractApiErrorMessage(error, 'Failed to set primary image.'));
      },
    });
  }

  protected openDeleteConfirm(imageId: string): void {
    this.pendingDeleteImageId.set(imageId);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteConfirm(): void {
    this.isDeleteModalOpen.set(false);
    this.pendingDeleteImageId.set(null);
  }

  protected confirmDeleteImage(): void {
    if (!this.productId) return;
    const imageId = this.pendingDeleteImageId();
    if (!imageId) return;

    this.sellerProductApi.deleteImage(this.productId, imageId).subscribe({
      next: (response) => {
        this.toast.success(response.message || 'Image deleted successfully.');
        this.images.update((items) => items.filter((item) => item._id !== imageId));
        this.closeDeleteConfirm();
      },
      error: (error: unknown) => {
        this.toast.error(extractApiErrorMessage(error, 'Failed to delete image.'));
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name.trim(),
      description: raw.description?.trim() || undefined,
      price: Number(raw.price),
      discount: raw.discount > 0 ? Number(raw.discount) : undefined,
      stock: Number(raw.stock),
      categoryId: raw.categoryId,
      isActive: raw.isActive,
    };

    const request$ = this.productId
      ? this.sellerProductApi.update(this.productId, payload)
      : this.sellerProductApi.create(payload);

    request$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: (response) => {
        this.toast.success(response.message || 'Product saved successfully.');
        this.router.navigate(['/seller/products']);
      },
      error: (error: unknown) => {
        const message = extractApiErrorMessage(error, 'Failed to save product.');
        this.errorMessage.set(message);
        this.toast.error(message);
      },
    });
  }

  private loadCategories(): void {
    this.sellerProductApi.getCategories().subscribe({
      next: (response) => this.categories.set(response.data?.categories ?? []),
      error: () => this.toast.error('Failed to load categories.'),
    });
  }

  private loadProduct(productId: string): void {
    this.isLoading.set(true);

    this.sellerProductApi
      .getById(productId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          const product = response.data?.product;
          if (!product) return;

          const categoryId =
            typeof product.categoryId === 'string' ? product.categoryId : (product.categoryId?._id ?? '');

          this.form.patchValue({
            name: product.name,
            description: product.description || '',
            price: Number(product.price ?? 0),
            discount: Number(product.discount ?? 0),
            stock: product.stock,
            categoryId,
            isActive: product.isActive,
          });
        },
        error: (error: unknown) => {
          const message = extractApiErrorMessage(error, 'Failed to load product details.');
          this.errorMessage.set(message);
          this.toast.error(message);
        },
      });
  }

  private loadImages(productId: string): void {
    this.isImagesLoading.set(true);

    this.sellerProductApi
      .getImages(productId)
      .pipe(finalize(() => this.isImagesLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.images.set(response.data?.images ?? []);
        },
        error: () => {
          this.images.set([]);
        },
      });
  }

  private addPendingFiles(files: File[]): void {
    if (files.length === 0) return;

    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    const nonImageCount = files.length - imageFiles.length;
    if (nonImageCount > 0) {
      this.toast.info(`${nonImageCount} file(s) were ignored because they are not images.`);
    }

    if (imageFiles.length === 0) return;

    const queued = imageFiles.map((file) => ({
      id: `${Date.now()}-${Math.random()}-${file.name}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    this.pendingUploads.update((current) => [...current, ...queued]);
  }

  private releasePendingPreviewUrls(): void {
    for (const item of this.pendingUploads()) {
      URL.revokeObjectURL(item.previewUrl);
    }
  }
}
