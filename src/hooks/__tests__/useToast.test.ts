import { renderHook, act } from '@testing-library/react';
import { useToast } from '../useToast';

describe('useToast', () => {
    it('should add a toast notification', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            result.current.showSuccess('Success message');
        });

        expect(result.current.toasts).toHaveLength(1);
        expect(result.current.toasts[0].type).toBe('success');
        expect(result.current.toasts[0].message).toBe('Success message');
    });

    it('should add error toast', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            result.current.showError('Error message');
        });

        expect(result.current.toasts).toHaveLength(1);
        expect(result.current.toasts[0].type).toBe('error');
    });

    it('should remove toast by id', () => {
        const { result } = renderHook(() => useToast());

        let toastId: string;
        act(() => {
            toastId = result.current.showInfo('Info message');
        });

        expect(result.current.toasts).toHaveLength(1);

        act(() => {
            result.current.removeToast(toastId);
        });

        expect(result.current.toasts).toHaveLength(0);
    });

    it('should clear all toasts', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            result.current.showSuccess('Toast 1');
            result.current.showWarning('Toast 2');
            result.current.showInfo('Toast 3');
        });

        expect(result.current.toasts).toHaveLength(3);

        act(() => {
            result.current.clearAll();
        });

        expect(result.current.toasts).toHaveLength(0);
    });

    it('should auto-dismiss toast after duration', async () => {
        jest.useFakeTimers();
        const { result } = renderHook(() => useToast());

        act(() => {
            result.current.showSuccess('Auto dismiss', 1000);
        });

        expect(result.current.toasts).toHaveLength(1);

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(result.current.toasts).toHaveLength(0);

        jest.useRealTimers();
    });
});
