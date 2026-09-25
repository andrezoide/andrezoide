import { useEffect } from 'react';
import { useAtlasStore } from '@/store/atlasStore';

/** Mantém o estado global sincronizado se o usuário mudar a preferência do SO em tempo real. */
export function useReducedMotionSync() {
  const setReducedMotion = useAtlasStore((s) => s.setReducedMotion);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [setReducedMotion]);
}
