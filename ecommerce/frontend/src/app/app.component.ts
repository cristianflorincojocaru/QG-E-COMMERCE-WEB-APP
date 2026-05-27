import { Component, OnInit } from '@angular/core';
import { RouterOutlet }       from '@angular/router';
import { NavbarComponent }    from './components/navbar/navbar.component';
import { ToastComponent }     from './components/toast/toast.component';
import { AuthService }        from './services/auth.service';
import { CartService }        from './services/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent],
  template: `
    <app-navbar />
    <main class="main-content">
      <router-outlet />
    </main>
    <!-- Global toast overlay — rendered above everything -->
    <app-toast />
  `
})
export class AppComponent implements OnInit {
  constructor(private auth: AuthService, private cart: CartService) {}

  ngOnInit(): void {
    // Preload cart if the user already has a session (token in localStorage)
    if (this.auth.isLoggedIn()) {
      this.cart.loadCart().subscribe();
    }
  }
}