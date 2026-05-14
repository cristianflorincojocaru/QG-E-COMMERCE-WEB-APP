import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService, Toast }       from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no toasts', () => {
    expect(service.toasts().length).toBe(0);
  });

  it('success() should add a toast with type "success"', () => {
    service.success('Item added!');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('success');
    expect(service.toasts()[0].message).toBe('Item added!');
  });

  it('error() should add a toast with type "error"', () => {
    service.error('Something went wrong.');
    expect(service.toasts()[0].type).toBe('error');
  });

  it('info() should add a toast with type "info"', () => {
    service.info('Item removed.');
    expect(service.toasts()[0].type).toBe('info');
  });

  it('dismiss() should remove the correct toast by id', () => {
    service.success('First');
    service.error('Second');
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Second');
  });

  it('should auto-dismiss after the specified duration', fakeAsync(() => {
    service.success('Auto-dismiss me', 1000);
    expect(service.toasts().length).toBe(1);
    tick(1000);
    expect(service.toasts().length).toBe(0);
  }));

  it('multiple toasts should each get a unique id', () => {
    service.success('A');
    service.success('B');
    service.success('C');
    const ids = service.toasts().map((t: Toast) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(3);
  });

  it('dismiss with unknown id should not throw or remove other toasts', () => {
    service.info('Keep me');
    expect(() => service.dismiss(99999)).not.toThrow();
    expect(service.toasts().length).toBe(1);
  });
});
