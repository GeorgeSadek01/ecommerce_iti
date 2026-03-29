import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../types/product.types';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css'],
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Input() categoryName: string = '';
  @Input() primaryImage: string = '';
  @Input() cssClass: string = '';

  onSaveClick(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    // Save button logic will be wired in parent or via service
  }
}
