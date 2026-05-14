import { Component }  from '@angular/core';
import { RouterLink }  from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero">
      <div class="hero-content">
        <p class="eyebrow">New Collection · 2025</p>
        <h1>Wear What<br>Matters.</h1>
        <p class="sub">Curated fashion from around the world — delivered with care.</p>
        <a routerLink="/products" class="hero-cta">Explore Collection</a>
      </div>
      <div class="hero-visual">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </section>

    <section class="features">
      <div class="feature">
        <div class="icon">✦</div>
        <h3>Curated Quality</h3>
        <p>Every piece selected for craftsmanship and style.</p>
      </div>
      <div class="feature">
        <div class="icon">◈</div>
        <h3>Fast Delivery</h3>
        <p>From our warehouse to your door in 3–5 days.</p>
      </div>
      <div class="feature">
        <div class="icon">◎</div>
        <h3>Easy Returns</h3>
        <p>Not the right fit? 30-day hassle-free returns.</p>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      min-height: calc(100vh - 64px);
      display: grid; grid-template-columns: 1fr 1fr;
      align-items: center; gap: 4rem;
      padding: 4rem 6rem;
      background: var(--bg);
      overflow: hidden;
    }
    .eyebrow {
      font-size: .75rem; letter-spacing: .2em; text-transform: uppercase;
      color: var(--accent); margin-bottom: 1.5rem;
      animation: fadeUp .6s ease both;
    }
    h1 {
      font-family: var(--font-display);
      font-size: clamp(3.5rem, 7vw, 6rem); line-height: 1;
      color: var(--text); margin-bottom: 1.5rem;
      animation: fadeUp .6s .1s ease both;
    }
    .sub {
      font-size: 1rem; color: var(--text-muted); max-width: 380px;
      line-height: 1.7; margin-bottom: 2.5rem;
      animation: fadeUp .6s .2s ease both;
    }
    .hero-cta {
      display: inline-block;
      background: var(--bg-dark); color: var(--text-light);
      padding: 1rem 2.5rem; font-size: .85rem;
      letter-spacing: .15em; text-transform: uppercase; text-decoration: none;
      transition: background .25s, transform .25s;
      animation: fadeUp .6s .3s ease both;
    }
    .hero-cta:hover { background: var(--accent); transform: translateY(-2px); }

    /* Geometric decoration */
    .hero-visual { position: relative; height: 500px; }
    .shape {
      position: absolute; border-radius: 50%;
      animation: float 6s ease-in-out infinite;
    }
    .shape-1 {
      width: 380px; height: 380px;
      background: var(--accent-light);
      top: 50%; left: 50%; transform: translate(-50%, -50%);
    }
    .shape-2 {
      width: 200px; height: 200px;
      background: rgba(212,168,83,.15);
      top: 10%; right: 10%;
      animation-delay: -2s;
    }
    .shape-3 {
      width: 120px; height: 120px;
      background: var(--bg-dark);
      bottom: 15%; left: 20%;
      border-radius: 8px;
      animation-delay: -4s;
    }
    @keyframes float {
      0%, 100% { transform: translate(-50%, -50%) translateY(0); }
      50%       { transform: translate(-50%, -50%) translateY(-20px); }
    }

    /* Features strip */
    .features {
      display: grid; grid-template-columns: repeat(3, 1fr);
      padding: 4rem 6rem; gap: 2rem;
      background: var(--bg-dark);
    }
    .feature {
      color: var(--text-light); padding: 2rem;
      border: 1px solid rgba(255,255,255,.08);
      transition: border-color .25s, transform .25s;
    }
    .feature:hover { border-color: var(--accent); transform: translateY(-4px); }
    .icon { font-size: 1.5rem; color: var(--accent); margin-bottom: 1rem; }
    .feature h3 {
      font-family: var(--font-display); font-size: 1.1rem; margin-bottom: .5rem;
    }
    .feature p { font-size: .85rem; color: rgba(255,255,255,.5); line-height: 1.6; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 900px) {
      .hero { grid-template-columns: 1fr; padding: 3rem 2rem; min-height: auto; }
      .hero-visual { display: none; }
      .features { grid-template-columns: 1fr; padding: 2rem; }
    }
  `]
})
export class HomeComponent {}
