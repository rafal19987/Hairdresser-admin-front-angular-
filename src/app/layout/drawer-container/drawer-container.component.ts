import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {NgComponentOutlet} from '@angular/common';
import {NavigationStart, Router} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {filter} from 'rxjs';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {
  DRAWER_WIDTHS,
  DrawerRequest,
  DrawerService,
  resolveDrawerMode,
} from '@/app/core/drawer/drawer.service';

@Component({
  selector: 'app-drawer-container',
  imports: [MatSidenavModule, NgComponentOutlet, MatIconButton, MatIcon],
  templateUrl: './drawer-container.component.html',
  styleUrl: './drawer-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'flex min-h-0 flex-1 flex-col'},
})
export class DrawerContainerComponent implements OnInit {
  protected readonly drawer = inject(DrawerService);

  private readonly _elementRef = inject(ElementRef<HTMLElement>);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _containerWidth = signal(0);

  // Stays set until the closing animation ends, so the panel does not slide out empty
  protected readonly $content = signal<DrawerRequest | null>(null);

  protected readonly $mode = computed(() =>
    resolveDrawerMode(
      this._containerWidth(),
      this.$content()?.size ?? 'compact',
    ),
  );

  protected readonly $width = computed(() => {
    const size = this.$content()?.size ?? 'compact';
    return this.$mode() === 'fullscreen'
      ? `min(${DRAWER_WIDTHS[size]}px, 100vw)`
      : `${DRAWER_WIDTHS[size]}px`;
  });

  constructor() {
    effect(() => {
      const request = this.drawer.$request();
      if (request) this.$content.set(request);
    });
  }

  ngOnInit(): void {
    const observer = new ResizeObserver(([entry]) =>
      this._containerWidth.set(entry.contentRect.width),
    );
    observer.observe(this._elementRef.nativeElement);
    this._destroyRef.onDestroy(() => observer.disconnect());

    // Details belong to the page they were opened from
    this._router.events
      .pipe(
        filter(event => event instanceof NavigationStart),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe(() => this.drawer.close());
  }
}
