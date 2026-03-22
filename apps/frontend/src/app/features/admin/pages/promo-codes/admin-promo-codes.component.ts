import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminPromoCodeService } from '../../data-access/admin-promo-code.service';
import { AdminPromoCode } from '../../data-access/admin.types';

@Component({
  selector: 'app-admin-promo-codes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-promo-codes.component.html',
  styleUrl: './admin-promo-codes.component.css',
  host: { class: 'd-block' },
})
export class AdminPromoCodesComponent implements OnInit {
  promoCodes = signal<AdminPromoCode[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalPages = signal(1);

  // Modal
  showModal = signal(false);
  isEditMode = signal(false);
  selectedPromoCode = signal<AdminPromoCode | null>(null);

  // Form Fields
  formData = signal({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    maxUses: undefined as number | undefined,
    expiryDate: '',
  });

  activeFilters = signal<'all' | 'active' | 'inactive'>('all');
  discountTypes = ['percentage', 'fixed'];

  constructor(private promoCodeService: AdminPromoCodeService) {}

  ngOnInit(): void {
    this.loadPromoCodes();
  }

  loadPromoCodes(): void {
    this.loading.set(true);
    this.error.set(null);

    this.promoCodeService.getPromoCodes(this.currentPage(), this.pageSize()).subscribe({
      next: (res) => {
        if (res.data?.items) {
          this.promoCodes.set(res.data.items);
          if (res.data.meta) {
            this.totalPages.set(res.data.meta.pages);
          }
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load promo codes');
        this.loading.set(false);
      },
    });
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadPromoCodes();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadPromoCodes();
    }
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.formData.set({
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      maxUses: undefined,
      expiryDate: '',
    });
    this.showModal.set(true);
  }

  openEditModal(promoCode: AdminPromoCode): void {
    this.isEditMode.set(true);
    this.selectedPromoCode.set(promoCode);
    this.formData.set({
      code: promoCode.code,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      maxUses: promoCode.maxUses,
      expiryDate: promoCode.expiryDate || '',
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedPromoCode.set(null);
  }

  savePromoCode(): void {
    const data = this.formData();

    if (!data.code || data.discountValue <= 0) {
      this.error.set('Please fill in all required fields');
      return;
    }

    const saveData: Partial<AdminPromoCode> = {
      code: data.code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      maxUses: data.maxUses,
      expiryDate: data.expiryDate,
    };

    if (this.isEditMode()) {
      const promoCode = this.selectedPromoCode();
      if (!promoCode) return;

      this.promoCodeService.updatePromoCode(promoCode._id, saveData).subscribe({
        next: () => {
          this.promoCodes.update((p) =>
            p.map((code) => (code._id === promoCode._id ? { ...code, ...saveData } : code))
          );
          this.closeModal();
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to update promo code');
        },
      });
    } else {
      this.promoCodeService.createPromoCode(saveData).subscribe({
        next: (res) => {
          if (res.data) {
            this.promoCodes.update((p) => [res.data as AdminPromoCode, ...p]);
          }
          this.closeModal();
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to create promo code');
        },
      });
    }
  }

  toggleActive(promoCode: AdminPromoCode): void {
    this.promoCodeService.toggleActive(promoCode._id).subscribe({
      next: (res) => {
        if (res.data) {
          this.promoCodes.update((p) =>
            p.map((code) => (code._id === promoCode._id ? (res.data as AdminPromoCode) : code))
          );
        }
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to toggle promo code');
      },
    });
  }

  deletePromoCode(promoCodeId: string): void {
    if (confirm('Are you sure you want to delete this promo code?')) {
      this.promoCodeService.deletePromoCode(promoCodeId).subscribe({
        next: () => {
          this.promoCodes.update((p) => p.filter((code) => code._id !== promoCodeId));
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to delete promo code');
        },
      });
    }
  }

  getFilteredCodes(): AdminPromoCode[] {
    const codes = this.promoCodes();
    if (this.activeFilters() === 'active') {
      return codes.filter((c) => c.isActive);
    } else if (this.activeFilters() === 'inactive') {
      return codes.filter((c) => !c.isActive);
    }
    return codes;
  }
}
