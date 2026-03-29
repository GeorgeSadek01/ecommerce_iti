import { Component, OnInit, OnDestroy, HostListener, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { WishlistHeartComponent } from '../../core/components/wishlist-heart/wishlist-heart.component';
import { ProductService } from '../../core/services/product.service';
import { BannerService, PublicBanner } from '../../core/services/banner.service';
import { AuthService } from '../../core/services/auth-api.service';
import { Product, Category } from '../../core/types/product.types';

interface HomeBannerSlide {
  id: string;
  image: string;
  badge: string;
  title: string;
  subtitle: string;
  buttonText: string;
  link: string;
  external: boolean;
}

const DEFAULT_BANNER_SLIDES: HomeBannerSlide[] = [
  {
    id: 'default-1',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1600&auto=format&fit=crop',
    badge: 'Welcome to Our Store',
    title: 'Shop Smarter. Live Better.',
    subtitle: 'Discover thousands of products from verified sellers across all categories.',
    buttonText: 'Start Shopping',
    link: '/search',
    external: false,
  },
  {
    id: 'default-2',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1600&auto=format&fit=crop',
    badge: 'Fast & Secure',
    title: 'Lightning Fast Delivery',
    subtitle: 'Get your favourite items delivered straight to your door with real-time tracking.',
    buttonText: 'View Deals',
    link: '/search',
    external: false,
  },
  {
    id: 'default-3',
    image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76ba?q=80&w=1600&auto=format&fit=crop',
    badge: 'Daily Deals',
    title: 'Unbeatable Offers Every Day',
    subtitle: 'Save up to 40% on top brands with our exclusive daily promotions.',
    buttonText: 'See Products',
    link: '/search',
    external: false,
  },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, WishlistHeartComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  protected readonly products = signal<Product[]>([]);
  protected readonly topRankedProducts = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly activeCategory = signal<string | null>(null);
  protected readonly searchQuery = signal('');

  protected readonly currentBannerSlide = signal(0);
  protected readonly topRankedScroll = signal(0);
  protected readonly topDealsPage = signal(0);
  protected readonly topDealsVisibleCount = signal(4);
  private slideInterval: any;
  private touchStartX = 0;
  private touchCurrentX = 0;
  private isPaused = false;
  protected readonly bannerSlides = signal<HomeBannerSlide[]>(DEFAULT_BANNER_SLIDES);

  protected readonly isLoggedIn = computed(() => this.authService.isAuthenticated());
  protected readonly topDealsPages = computed(() => {
    const items = this.products();
    const pageSize = Math.max(1, this.topDealsVisibleCount());
    const pages: Product[][] = [];

    for (let i = 0; i < items.length; i += pageSize) {
      pages.push(items.slice(i, i + pageSize));
    }

    return pages;
  });
  protected readonly canGoTopDealsPrev = computed(() => this.topDealsPage() > 0);
  protected readonly canGoTopDealsNext = computed(() => this.topDealsPage() < this.topDealsPages().length - 1);

  constructor(
    private readonly productService: ProductService,
    private readonly bannerService: BannerService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    effect(() => {
      const lastPage = Math.max(0, this.topDealsPages().length - 1);
      if (this.topDealsPage() > lastPage) {
        this.topDealsPage.set(lastPage);
      }
    });
  }

  ngOnInit(): void {
    this.updateTopDealsVisibleCount();
    this.loadCategories();
    this.loadProducts();
    this.startBannerSlider();
    this.loadBanners();
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.updateTopDealsVisibleCount();
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  private startBannerSlider(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }

    if (this.bannerSlides().length <= 1) {
      return;
    }

    this.slideInterval = setInterval(() => {
      if (!this.isPaused) this.nextBanner();
    }, 5000);
  }

  protected nextBanner(): void {
    const total = this.bannerSlides().length;
    if (total <= 1) return;
    this.currentBannerSlide.update((curr) => (curr + 1) % total);
  }

  protected prevBanner(): void {
    const total = this.bannerSlides().length;
    if (total <= 1) return;
    this.currentBannerSlide.update((curr) => (curr - 1 + total) % total);
  }

  protected goToBanner(index: number): void {
    const total = this.bannerSlides().length;
    if (index < 0 || index >= total) return;

    this.currentBannerSlide.set(index);
    this.startBannerSlider();
  }

  protected pauseBanner(): void {
    this.isPaused = true;
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.slideInterval = undefined;
    }
  }

  protected resumeBanner(): void {
    this.isPaused = false;
    this.startBannerSlider();
  }

  // Touch handlers for swipe support
  onTouchStart(ev: TouchEvent): void {
    this.touchStartX = ev.touches[0]?.clientX || 0;
    this.touchCurrentX = this.touchStartX;
    this.pauseBanner();
  }

  onTouchMove(ev: TouchEvent): void {
    this.touchCurrentX = ev.touches[0]?.clientX || this.touchCurrentX;
  }

  onTouchEnd(): void {
    const dx = this.touchCurrentX - this.touchStartX;
    const threshold = 50; // px
    if (dx > threshold) {
      this.prevBanner();
    } else if (dx < -threshold) {
      this.nextBanner();
    }
    this.touchStartX = 0;
    this.touchCurrentX = 0;
    this.resumeBanner();
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

  private loadBanners(): void {
    this.bannerService.getBanners(8).subscribe({
      next: (banners) => {
        const mappedSlides = banners
          .filter((banner) => typeof banner.imageUrl === 'string' && banner.imageUrl.trim().length > 0)
          .map((banner) => this.mapBannerToSlide(banner));

        this.setBannerSlides(mappedSlides);
      },
      error: () => {
        this.setBannerSlides(DEFAULT_BANNER_SLIDES);
      },
    });
  }

  private setBannerSlides(slides: HomeBannerSlide[]): void {
    const safeSlides = slides.length ? slides : DEFAULT_BANNER_SLIDES;
    this.bannerSlides.set(safeSlides);

    if (this.currentBannerSlide() >= safeSlides.length) {
      this.currentBannerSlide.set(0);
    }

    this.startBannerSlider();
  }

  private mapBannerToSlide(banner: PublicBanner): HomeBannerSlide {
    const link = this.normalizeBannerLink(banner.linkUrl);
    const title = (banner.title || 'Featured Collection').trim();

    return {
      id: banner.id,
      image: banner.imageUrl,
      badge: 'Featured',
      title,
      subtitle: 'Discover handpicked offers and trending products from verified sellers.',
      buttonText: 'Shop Now',
      link,
      external: this.isExternalLink(link),
    };
  }

  private normalizeBannerLink(linkUrl?: string | null): string {
    if (!linkUrl || !linkUrl.trim()) {
      return '/search';
    }

    const rawLink = linkUrl.trim();

    if (this.isExternalLink(rawLink)) {
      return rawLink;
    }

    return rawLink.startsWith('/') ? rawLink : `/${rawLink}`;
  }

  protected isExternalLink(link: string): boolean {
    return /^https?:\/\//i.test(link) || /^\/\//.test(link);
  }

  private loadProducts(categoryId?: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    const handleSuccess = (res: any) => {
      const prods = res.data?.products ?? [];
      // Compute top-ranked products: products sorted by averageRating (highest first)
      // First try products with averageRating > 0
      let ranked = (prods as Product[])
        .filter((p) => (p as any).averageRating && (p as any).averageRating > 0)
        .sort((a, b) => ((b as any).averageRating ?? 0) - ((a as any).averageRating ?? 0))
        .slice(0, 8);

      // If none with rating, show all products sorted by rating (descending)
      if (ranked.length === 0) {
        ranked = (prods as Product[])
          .sort((a, b) => ((b as any).averageRating ?? 0) - ((a as any).averageRating ?? 0))
          .slice(0, 8);
      }

      console.log('Top Ranked Products:', ranked);
      this.topRankedProducts.set(ranked);
      // If no category selected, show Top Deals: products with a discount > 0
      if (!categoryId) {
        const deals = (prods as Product[])
          .filter((p) => (p.discount ?? 0) > 0)
          .sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
        this.products.set(deals);
      } else {
        this.products.set(prods);
      }
      this.topDealsPage.set(0);
      this.isLoading.set(false);

      // Fetch images for each product and update both products and topRankedProducts signals
      const updateImages = (prod: Product) => {
        this.productService.getProductImages(prod._id).subscribe({
          next: (imgRes: any) => {
            const images = imgRes.data?.images ?? imgRes.images ?? [];
            if (images.length > 0) {
              // Update topRankedProducts if the product is in there
              this.topRankedProducts.update((curr) => {
                const idx = curr.findIndex((p) => p._id === prod._id);
                if (idx !== -1) {
                  const copy = [...curr];
                  copy[idx] = { ...copy[idx], images: images };
                  return copy;
                }
                return curr;
              });
              // Update products
              this.products.update((curr) => {
                const idx = curr.findIndex((p) => p._id === prod._id);
                if (idx !== -1) {
                  const copy = [...curr];
                  copy[idx] = { ...copy[idx], images: images };
                  return copy;
                }
                return curr;
              });
            }
          },
        });
      };
      prods.forEach(updateImages);
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
      this.productService.getProducts(1, 12).subscribe({ next: handleSuccess, error: handleError });
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
    if (!id) return 'Top Deals';
    return this.categories().find((c) => c._id === id)?.name ?? 'Products';
  }

  protected scrollTopRanked(direction: 'left' | 'right'): void {
    const container = document.getElementById('topRankedCarousel');
    if (container) {
      const cardWidth = 320; // 280px card + 20px gap estimate
      const amount = direction === 'right' ? cardWidth : -cardWidth;
      container.scrollBy({ left: amount, behavior: 'smooth' });
    }
  }

  protected prevTopDealsPage(): void {
    this.topDealsPage.update((current) => Math.max(0, current - 1));
  }

  protected nextTopDealsPage(): void {
    const lastPage = Math.max(0, this.topDealsPages().length - 1);
    this.topDealsPage.update((current) => Math.min(lastPage, current + 1));
  }

  protected goToTopDealsPage(index: number): void {
    const lastPage = Math.max(0, this.topDealsPages().length - 1);
    this.topDealsPage.set(Math.max(0, Math.min(index, lastPage)));
  }

  private updateTopDealsVisibleCount(): void {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const nextCount = width >= 1200 ? 4 : width >= 900 ? 3 : width >= 640 ? 2 : 1;

    if (this.topDealsVisibleCount() !== nextCount) {
      this.topDealsVisibleCount.set(nextCount);
      this.topDealsPage.set(0);
    }
  }

  protected scrollCategories(direction: 'left' | 'right'): void {
    const container = document.getElementById('categoriesCarousel');
    if (container) {
      const cardWidth = 320; // match other carousels
      const amount = direction === 'right' ? cardWidth : -cardWidth;
      container.scrollBy({ left: amount, behavior: 'smooth' });
    }
  }
}
