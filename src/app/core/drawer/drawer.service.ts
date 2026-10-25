import {computed, Injectable, signal, Type} from '@angular/core';

export type DrawerSize = 'compact' | 'wide';

// side: next to the content, over: covers the content but not the navigation,
// fullscreen: covers the whole screen when the work area is too narrow
export type DrawerMode = 'side' | 'over' | 'fullscreen';

export interface DrawerRequest {
  component: Type<unknown>;
  inputs: Record<string, unknown>;
  size: DrawerSize;
  title: string;
}

export const DRAWER_WIDTHS: Record<DrawerSize, number> = {
  compact: 400,
  wide: 720,
};

// Work area that must stay usable next to a side drawer
export const MIN_CONTENT_BESIDE_DRAWER = 640;

// Below this much uncovered work area an over drawer is pointless, so it goes full screen
export const MIN_VISIBLE_CONTENT = 240;

export const resolveDrawerMode = (
  containerWidth: number,
  size: DrawerSize,
): DrawerMode => {
  const drawerWidth = DRAWER_WIDTHS[size];

  if (containerWidth < drawerWidth + MIN_VISIBLE_CONTENT) return 'fullscreen';
  if (
    size === 'compact' &&
    containerWidth - drawerWidth >= MIN_CONTENT_BESIDE_DRAWER
  ) {
    return 'side';
  }
  return 'over';
};

@Injectable({
  providedIn: 'root',
})
export class DrawerService {
  private readonly _request = signal<DrawerRequest | null>(null);

  readonly $request = this._request.asReadonly();
  readonly $isOpen = computed(() => this._request() !== null);

  // Opening while another request is shown replaces its content
  public open(
    component: Type<unknown>,
    options: {
      title: string;
      inputs?: Record<string, unknown>;
      size?: DrawerSize;
    },
  ): void {
    this._request.set({
      component,
      title: options.title,
      inputs: options.inputs ?? {},
      size: options.size ?? 'compact',
    });
  }

  public setSize(size: DrawerSize): void {
    this._request.update(request => (request ? {...request, size} : request));
  }

  public close(): void {
    this._request.set(null);
  }
}
