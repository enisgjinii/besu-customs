
import { useEffect, useRef, useState } from 'react';

interface PinchZoomState {
    isPinching: boolean;
    scale: number;
    delta: number;
    origin: { x: number; y: number };
}

interface UsePinchZoomOptions {
    onPinchStart?: (state: PinchZoomState) => void;
    onPinch?: (state: PinchZoomState) => void;
    onPinchEnd?: (state: PinchZoomState) => void;
    minScale?: number;
    maxScale?: number;
    enabled?: boolean;
}

export function usePinchZoom(
    ref: React.RefObject<HTMLElement | null>,
    options: UsePinchZoomOptions = {}
) {
    const {
        onPinchStart,
        onPinch,
        onPinchEnd,
        minScale = 0.5,
        maxScale = 3,
        enabled = true,
    } = options;

    const [state, setState] = useState<PinchZoomState>({
        isPinching: false,
        scale: 1,
        delta: 0,
        origin: { x: 0, y: 0 },
    });

    const initialDistanceRef = useRef<number>(0);
    const initialScaleRef = useRef<number>(1);
    const rafId = useRef<number | null>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element || !enabled) return;

        const getDistance = (touches: TouchList) => {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        const getMidpoint = (touches: TouchList) => {
            return {
                x: (touches[0].clientX + touches[1].clientX) / 2,
                y: (touches[0].clientY + touches[1].clientY) / 2,
            };
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                initialDistanceRef.current = getDistance(e.touches);
                initialScaleRef.current = state.scale;

                const origin = getMidpoint(e.touches);
                const newState = {
                    isPinching: true,
                    scale: state.scale,
                    delta: 0,
                    origin,
                };

                setState(newState);
                onPinchStart?.(newState);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2 && state.isPinching) {
                e.preventDefault(); // Prevent page zoom

                const currentDistance = getDistance(e.touches);
                const scaleFactor = currentDistance / initialDistanceRef.current;
                let newScale = initialScaleRef.current * scaleFactor;

                // Clamp scale
                newScale = Math.min(Math.max(newScale, minScale), maxScale);

                const newState = {
                    ...state,
                    scale: newScale,
                    delta: scaleFactor,
                    origin: getMidpoint(e.touches),
                };

                if (rafId.current) cancelAnimationFrame(rafId.current);
                rafId.current = requestAnimationFrame(() => {
                    setState(newState);
                    onPinch?.(newState);
                });
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (state.isPinching && e.touches.length < 2) {
                const newState = { ...state, isPinching: false };
                setState(newState);
                onPinchEnd?.(newState);
            }
        };

        element.addEventListener('touchstart', handleTouchStart, { passive: false });
        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        element.addEventListener('touchend', handleTouchEnd);
        element.addEventListener('touchcancel', handleTouchEnd);

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
            element.removeEventListener('touchcancel', handleTouchEnd);
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, [ref, enabled, minScale, maxScale, onPinchStart, onPinch, onPinchEnd, state.isPinching, state.scale]);

    return state;
}
