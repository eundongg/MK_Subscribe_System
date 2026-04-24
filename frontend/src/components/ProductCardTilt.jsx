import { useCallback, useRef } from "react";

const PERSPECTIVE = 720;
const MAX_DEG = 6;

/**
 * article 전체(테두리·그림자 포함)가 마우스에 맞춰 살짝 기울어짐.
 * 터치(coarse pointer)에서는 동작하지 않음.
 */
export default function ProductCardTilt({ children, className = "", ...rest }) {
  const articleRef = useRef(null);

  const onMove = useCallback((e) => {
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
      return;
    }
    const el = articleRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width || 1;
    const h = rect.height || 1;
    const rx = ((2 * MAX_DEG) / h) * y - MAX_DEG;
    const ry = ((-2 * MAX_DEG) / w) * x + MAX_DEG;
    el.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
  }, []);

  const onLeave = useCallback(() => {
    const el = articleRef.current;
    if (!el) return;
    el.style.transform = `perspective(${PERSPECTIVE}px) rotateX(0deg) rotateY(0deg)`;
  }, []);

  return (
    <article
      ref={articleRef}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      {...rest}
    >
      {children}
    </article>
  );
}
