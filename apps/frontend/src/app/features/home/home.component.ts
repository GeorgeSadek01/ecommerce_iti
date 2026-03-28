import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth-api.service';
import { Product, Category } from '../../core/types/product.types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly activeCategory = signal<string | null>(null);
  protected readonly searchQuery = signal('');

  protected readonly currentBannerSlide = signal(0);
  private slideInterval: any;

  protected readonly bannerSlides = [
    {
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1600&auto=format&fit=crop',
      badge: 'Welcome to Our Store',
      title: 'Shop Smarter. Live Better.',
      subtitle: 'Discover thousands of products from verified sellers across all categories.',
      buttonText: 'Start Shopping',
      link: '/search'
    },
    {
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1600&auto=format&fit=crop',
      badge: 'Fast & Secure',
      title: 'Lightning Fast Delivery',
      subtitle: 'Get your favourite items delivered straight to your door with real-time tracking.',
      buttonText: 'View Deals',
      link: '/search'
    },
    {
      image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76ba?q=80&w=1600&auto=format&fit=crop',
      badge: 'Daily Deals',
      title: 'Unbeatable Offers Every Day',
      subtitle: 'Save up to 40% on top brands with our exclusive daily promotions.',
      buttonText: 'See Products',
      link: '/search'
    }
  ];

  protected readonly isLoggedIn = computed(() => this.authService.isAuthenticated());

  constructor(
    private readonly productService: ProductService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    this.startBannerSlider();
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  private startBannerSlider(): void {
    this.slideInterval = setInterval(() => {
      this.nextBanner();
    }, 6000);
  }

  protected nextBanner(): void {
    this.currentBannerSlide.update(curr => (curr + 1) % this.bannerSlides.length);
  }

  protected prevBanner(): void {
    this.currentBannerSlide.update(curr => (curr - 1 + this.bannerSlides.length) % this.bannerSlides.length);
  }

  protected goToBanner(index: number): void {
    this.currentBannerSlide.set(index);
    if (this.slideInterval) clearInterval(this.slideInterval);
    this.startBannerSlider();
  }

  private loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (res) => {
        const cats = res.data?.categories ?? [];
        this.categories.set(cats);
      },
      error: () => {
        // non-fatal — page still works without categories
      },
    });
  }

  private loadProducts(categoryId?: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    const handleSuccess = (res: any) => {
      const prods = res.data?.products ?? [];
      this.products.set(prods);
      this.isLoading.set(false);
      
      // Fetch images for each product
      prods.forEach((prod: Product) => {
        this.productService.getProductImages(prod._id).subscribe({
          next: (imgRes: any) => {
            const images = imgRes.data?.images ?? imgRes.images ?? [];
            if (images.length > 0) {
              this.products.update(curr => {
                const idx = curr.findIndex(p => p._id === prod._id);
                if (idx !== -1) {
                  const copy = [...curr];
                  copy[idx] = { ...copy[idx], images: images };
                  return copy;
                }
                return curr;
              });
            }
          }
        });
      });
    };

    const handleError = () => {
      this.error.set('Failed to load products. Please try again.');
      this.isLoading.set(false);
    };

    if (categoryId) {
      this.productService
        .searchProducts({ category: categoryId, limit: 12 })
        .subscribe({ next: handleSuccess, error: handleError });
    } else {
      this.productService
        .getProducts(1, 12)
        .subscribe({ next: handleSuccess, error: handleError });
    }
  }

  protected selectCategory(categoryId: string | null): void {
    this.activeCategory.set(categoryId);
    if (categoryId) {
      this.loadProducts(categoryId);
    } else {
      this.loadProducts();
    }
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  protected onSearch(): void {
    const q = this.searchQuery().trim();
    if (!q) return;
    
    this.router.navigate(['/search'], { queryParams: { q } });
  }

  protected onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.onSearch();
  }

  protected getPrimaryImage(product: Product): string {
    const primary = product.images?.find((img) => img.isPrimary);
    return primary?.url ?? product.images?.[0]?.url ?? '';
  }

  protected getCategoryName(product: Product): string {
    const cat = product.categoryId;
    if (typeof cat === 'object' && cat !== null) {
      return (cat as Category).name;
    }
    return '';
  }

  protected getCategoryLabel(): string {
    const id = this.activeCategory();
    if (!id) return 'Featured Products';
    return this.categories().find((c) => c._id === id)?.name ?? 'Products';
  }
}
