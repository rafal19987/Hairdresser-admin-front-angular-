import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {
  DRAWER_WIDTHS,
  DrawerService,
  MIN_CONTENT_BESIDE_DRAWER,
  MIN_VISIBLE_CONTENT,
  resolveDrawerMode,
} from './drawer.service';

@Component({template: ''})
class FirstContent {}

@Component({template: ''})
class SecondContent {}

describe('resolveDrawerMode', () => {
  it('places compact content beside the work area when it still fits', () => {
    const width = DRAWER_WIDTHS.compact + MIN_CONTENT_BESIDE_DRAWER;

    expect(resolveDrawerMode(width, 'compact')).toBe('side');
  });

  it('covers the work area when compact content would squeeze it', () => {
    const width = DRAWER_WIDTHS.compact + MIN_CONTENT_BESIDE_DRAWER - 1;

    expect(resolveDrawerMode(width, 'compact')).toBe('over');
  });

  it('always covers the work area with wide content', () => {
    expect(resolveDrawerMode(2000, 'wide')).toBe('over');
  });

  it('goes full screen when too little of the work area would stay visible', () => {
    expect(
      resolveDrawerMode(DRAWER_WIDTHS.wide + MIN_VISIBLE_CONTENT - 1, 'wide'),
    ).toBe('fullscreen');
    expect(resolveDrawerMode(375, 'compact')).toBe('fullscreen');
  });
});

describe('DrawerService', () => {
  let service: DrawerService;

  beforeEach(() => {
    service = TestBed.inject(DrawerService);
  });

  it('opens with compact size by default and closes', () => {
    service.open(FirstContent, {title: 'Wizyta'});

    expect(service.$isOpen()).toBeTrue();
    expect(service.$request()?.size).toBe('compact');

    service.close();

    expect(service.$isOpen()).toBeFalse();
  });

  it('replaces content when opened again', () => {
    service.open(FirstContent, {title: 'Pierwsza', inputs: {id: 1}});
    service.open(SecondContent, {title: 'Druga', inputs: {id: 2}, size: 'wide'});

    expect(service.$request()).toEqual({
      component: SecondContent,
      title: 'Druga',
      inputs: {id: 2},
      size: 'wide',
    });
  });

  it('changes size of the open content only', () => {
    service.setSize('wide');
    expect(service.$request()).toBeNull();

    service.open(FirstContent, {title: 'Wizyta'});
    service.setSize('wide');

    expect(service.$request()?.size).toBe('wide');
  });
});
