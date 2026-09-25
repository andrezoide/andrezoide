import { useMemo } from 'react';
import katex from 'katex';

interface Props {
  math: string;
  display?: boolean;
  className?: string;
}

/** Wrapper mínimo sobre KaTeX — evita depender de react-katex apenas para isto. */
export function TeX({ math, display = false, className }: Props) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: display,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return math;
    }
  }, [math, display]);

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
