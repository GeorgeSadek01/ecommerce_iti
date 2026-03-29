import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth-api.service';
import { ToastService } from '../../core/services/toast.service';
import { CartItem } from '../../core/types/cart.types';
import { Product } from '../../core/types/product.types';
import { Address } from '../../core/types/auth.types';
import { extractApiErrorMessage } from '../../core/utils/http-error.util';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit {
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busyItemIds = signal<Set<string>>(new Set());
  protected readonly addresses = signal<Address[]>([]);
  protected readonly selectedAddressId = signal<string>('');
  protected readonly promoCode = signal('');
  protected readonly isPlacingOrder = signal(false);
  protected readonly isRedirectingToPayment = signal(false);
  protected readonly orderSuccess = signal(false);
  protected readonly orderError = signal<string | null>(null);
  protected readonly showCheckout = signal(false);

  protected readonly items = computed(() => this.cartService.items());
  protected readonly itemCount = computed(() => this.cartService.itemCount());
  protected readonly subtotal = computed(() => this.cartService.total());

  constructor(
    protected readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
    private readonly authService: AuthService,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadCart();

    if (this.authService.isAuthenticated()) {
      this.loadAddresses();
    }
  }

  private loadCart(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.cartService.loadCart().subscribe({
      next: () => this.isLoading.set(false),
      error: (err: unknown) => {
        this.error.set(extractApiErrorMessage(err, 'Failed to load your cart. Please try again.'));
        this.isLoading.set(false);
      },
    });
  }

  private loadAddresses(): void {
    this.authService.getAddresses().subscribe({
      next: (res) => {
        const addrs = res.data?.addresses ?? [];
        this.addresses.set(addrs);
        const def = addrs.find((a) => a.isDefault);
        if (def) this.selectedAddressId.set(def.id);
        else if (addrs.length) this.selectedAddressId.set(addrs[0].id);
      },
      error: () => {},
    });
  }

  protected getProduct(item: CartItem): Product | null {
    if (typeof item.productId === 'object') return item.productId as Product;
    return null;
  }

  protected getProductName(item: CartItem): string {
    return this.getProduct(item)?.name ?? 'Product';
  }

  protected getProductImage(item: CartItem): string {
    const prod = this.getProduct(item);
    const primary = prod?.images?.find((img) => img.isPrimary);
    return primary?.url ?? prod?.images?.[0]?.url ?? '';
  }

  protected getLineTotal(item: CartItem): number {
    return item.priceSnapshot * item.quantity;
  }

  protected isBusy(itemId: string): boolean {
    return this.busyItemIds().has(itemId);
  }

  private setBusy(itemId: string, busy: boolean): void {
    this.busyItemIds.update((set) => {
      const next = new Set(set);
      busy ? next.add(itemId) : next.delete(itemId);
      return next;
    });
  }

  protected increase(item: CartItem): void {
    this.setBusy(item._id, true);
    this.cartService.increaseQty(item._id).subscribe({
      next: () => this.setBusy(item._id, false),
      error: () => this.setBusy(item._id, false),
    });
  }

  protected decrease(item: CartItem): void {
    this.setBusy(item._id, true);
    this.cartService.decreaseQty(item._id).subscribe({
      next: () => this.setBusy(item._id, false),
      error: () => this.setBusy(item._id, false),
    });
  }

  protected remove(item: CartItem): void {
    this.setBusy(item._id, true);
    this.cartService.removeItem(item._id).subscribe({
      next: () => this.setBusy(item._id, false),
      error: () => this.setBusy(item._id, false),
    });
  }

  protected clearCart(): void {
    this.cartService.clearCart().subscribe({ error: () => {} });
  }

  protected toggleCheckout(): void {
    this.showCheckout.update((v) => !v);
  }

  protected onPromoInput(event: Event): void {
    this.promoCode.set((event.target as HTMLInputElement).value);
  }

  protected onAddressChange(event: Event): void {
    this.selectedAddressId.set((event.target as HTMLSelectElement).value);
  }

  protected placeOrder(): void {
    if (!this.authService.isAuthenticated()) {
      this.toast.info('Please log in to place your order.');
      this.router.navigate(['/auth/login']);
      return;
    }

    const addressId = this.selectedAddressId();
    if (!addressId) {
      this.orderError.set('Please select a delivery address.');
      return;
    }

    this.isPlacingOrder.set(true);
    this.orderError.set(null);

    const payload: { addressId: string; promoCode?: string } = { addressId };
    const code = this.promoCode().trim();
    if (code) payload['promoCode'] = code;

    this.orderService.placeOrder(payload).subscribe({
      next: () => {
        this.isPlacingOrder.set(false);
        this.orderSuccess.set(true);
        this.showCheckout.set(false);
        this.cartService.clearCart().subscribe({
          next: () => {},
          error: () => {
            this.cartService.setItems([]);
          },
        });
        this.promoCode.set('');
      },
      error: (err) => {
        this.isPlacingOrder.set(false);
        const msg = err?.error?.message ?? 'Failed to place the order. Please try again.';
        this.orderError.set(msg);
      },
    });
  }

  protected checkoutWithCard(): void {
    if (!this.authService.isAuthenticated()) {
      this.toast.info('Please log in to continue with card payment.');
      this.router.navigate(['/auth/login']);
      return;
    }

    const addressId = this.selectedAddressId();
    if (!addressId) {
      this.orderError.set('Please select a delivery address.');
      return;
    }

    this.orderError.set(null);
    this.isRedirectingToPayment.set(true);

    this.paymentService.createCheckoutSession(addressId).subscribe({
      next: (res) => {
        const checkoutUrl = res.data?.checkoutUrl;
        if (!checkoutUrl) {
          this.isRedirectingToPayment.set(false);
          this.orderError.set('Failed to start payment session. Please try again.');
          return;
        }

        window.location.assign(checkoutUrl);
      },
      error: (err: unknown) => {
        this.isRedirectingToPayment.set(false);
        this.orderError.set(extractApiErrorMessage(err, 'Failed to start Stripe checkout.'));
      },
    });
  }
}
