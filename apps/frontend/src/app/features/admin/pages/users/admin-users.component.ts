import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUserService } from '../../data-access/admin-user.service';
import { AdminUser } from '../../data-access/admin.types';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css',
})
export class AdminUsersComponent implements OnInit {
  users = signal<AdminUser[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalPages = signal(1);

  // Filters
  searchQuery = signal('');
  selectedRole = signal<string>('');

  hasActiveFilters = computed(() => Boolean(this.searchQuery().trim() || this.selectedRole()));

  // Modal
  selectedUser = signal<AdminUser | null>(null);
  showUserModal = signal(false);
  selectedRoleForUpdate = signal<string>('');

  roles = ['customer', 'seller', 'admin'];
  pageSizeOptions = [10, 20, 30, 50];

  constructor(private userService: AdminUserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    const page = this.currentPage();
    const limit = this.pageSize();
    const query = this.searchQuery() || undefined;
    const role = this.selectedRole() || undefined;

    this.userService.getUsers(page, limit, query, role).subscribe({
      next: (res) => {
        if (res.data?.items) {
          this.users.set(res.data.items);
          if (res.data.meta) {
            this.totalPages.set(res.data.meta.pages);
          }
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load users');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadUsers();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadUsers();
  }

  onPageSizeChange(nextSize: number): void {
    this.pageSize.set(Number(nextSize));
    this.currentPage.set(1);
    this.loadUsers();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedRole.set('');
    this.currentPage.set(1);
    this.loadUsers();
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadUsers();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadUsers();
    }
  }

  openUserModal(user: AdminUser): void {
    if (!this.canManageUser(user)) {
      this.error.set('Admin accounts cannot be edited from this screen.');
      return;
    }
    this.selectedUser.set(user);
    this.selectedRoleForUpdate.set(user.role);
    this.showUserModal.set(true);
  }

  closeUserModal(): void {
    this.showUserModal.set(false);
    this.selectedUser.set(null);
  }

  updateUserRole(): void {
    const user = this.selectedUser();
    const newRole = this.selectedRoleForUpdate();
    if (!user || !newRole) return;
    if (!this.canManageUser(user)) {
      this.error.set('Admin accounts cannot be edited from this screen.');
      return;
    }

    this.userService.updateUserRole(user._id, newRole).subscribe({
      next: () => {
        this.users.update((u) => u.map((usr) => (usr._id === user._id ? { ...usr, role: newRole as any } : usr)));
        this.closeUserModal();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update user role');
      },
    });
  }

  deleteUser(userId: string): void {
    const user = this.users().find((candidate) => candidate._id === userId);
    if (user && !this.canManageUser(user)) {
      this.error.set('Admin accounts cannot be deleted.');
      return;
    }

    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.users.update((u) => u.filter((usr) => usr._id !== userId));
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to delete user');
        },
      });
    }
  }

  restoreUser(userId: string): void {
    this.userService.restoreUser(userId).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to restore user');
      },
    });
  }

  canManageUser(user: AdminUser): boolean {
    return user.role !== 'admin';
  }
}
