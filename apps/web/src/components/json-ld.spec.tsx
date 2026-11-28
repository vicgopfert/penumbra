import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JsonLd } from './json-ld';

describe('JsonLd', () => {
  it('um texto com "</script>" não fecha a tag, e o JSON continua o mesmo', () => {
    const data = { name: 'Jogo</script><script>alert(1)</script>' };

    const { container } = render(<JsonLd data={data} />);

    const scripts = container.querySelectorAll('script');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.innerHTML).not.toContain('</script>');
    expect(JSON.parse(scripts[0]?.textContent ?? '')).toEqual(data);
  });
});
