// 教材で使うTailwindユーティリティの固定サブセット。CDN通信・スクリプトは不要。
const utilities: Record<string, string> = {
  'w-72': 'width:18rem', 'w-80': 'width:20rem', 'w-full': 'width:100%',
  'h-36': 'height:9rem', 'h-40': 'height:10rem', 'h-44': 'height:11rem',
  'object-cover': 'object-fit:cover', 'object-contain': 'object-fit:contain',
  'p-4': 'padding:1rem', 'p-5': 'padding:1.25rem',
  'px-2': 'padding-left:.5rem;padding-right:.5rem', 'px-3': 'padding-left:.75rem;padding-right:.75rem',
  'px-5': 'padding-left:1.25rem;padding-right:1.25rem',
  'py-1': 'padding-top:.25rem;padding-bottom:.25rem', 'py-2': 'padding-top:.5rem;padding-bottom:.5rem', 'py-4': 'padding-top:1rem;padding-bottom:1rem',
  'rounded': 'border-radius:.25rem', 'rounded-lg': 'border-radius:.5rem', 'rounded-xl': 'border-radius:.75rem',
  'shadow-lg': 'box-shadow:0 10px 15px -3px #0002,0 4px 6px -4px #0002', 'shadow-2xl': 'box-shadow:0 25px 50px -12px #0006',
  'text-xs': 'font-size:.75rem;line-height:1rem', 'text-sm': 'font-size:.875rem;line-height:1.25rem', 'text-xl': 'font-size:1.25rem;line-height:1.75rem',
  'font-bold': 'font-weight:700', 'font-semibold': 'font-weight:600', 'leading-relaxed': 'line-height:1.625',
  'overflow-hidden': 'overflow:hidden', 'flex': 'display:flex', 'gap-2': 'gap:.5rem',
};
const colors: Record<string, string> = {
  white: '#fff', black: '#000', 'zinc-950': '#09090b', 'zinc-800': '#27272a', 'zinc-700': '#3f3f46',
  'zinc-600': '#52525b', 'zinc-400': '#a1a1aa', 'zinc-300': '#d4d4d8',
  'gray-900': '#111827', 'gray-800': '#1f2937', 'gray-700': '#374151', 'gray-600': '#4b5563', 'gray-300': '#d1d5db', 'gray-100': '#f3f4f6',
  'purple-400': '#c084fc', 'purple-500': '#a855f7', 'purple-600': '#9333ea',
  'orange-100': '#ffedd5', 'orange-500': '#f97316', 'orange-700': '#c2410c', 'yellow-400': '#facc15',
};
for (const [name, value] of Object.entries(colors)) {
  utilities[`bg-${name}`] = `background-color:${value}`;
  utilities[`text-${name}`] = `color:${value}`;
}
const css = Object.entries(utilities).map(([name, value]) => `.${name}{${value}}`).join('\n');
function illustration(label: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#101827"/><stop offset="1" stop-color="${color}"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><circle cx="450" cy="130" r="100" fill="white" opacity=".12"/><path d="M0 300L200 120L360 300L500 210L640 360H0" fill="#000" opacity=".35"/><text x="32" y="300" fill="white" font-size="30" font-family="sans-serif" letter-spacing="4">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
const assets: Record<string, string> = {
  './images/poster.jpg': illustration('INTERSTELLAR', '#477e90'),
  './images/cover.jpg': illustration('NEON GHOST', '#9333ea'),
  './images/event.jpg': illustration('POSSE HACKATHON', '#f97316'),
};
export function buildPreviewDocument(code: string): string {
  const resolved = code.replace(/src="(\.\/images\/[^"<>]+)"/g, (_, path: string) => `src="${assets[path] ?? ''}"`);
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif}h1,p,ul{margin:0}ul{padding:0;list-style:none}button{font:inherit;border:0}img{display:block}article{margin:auto;max-width:100%}main{min-height:100vh}.space-y-1>*+*{margin-top:.25rem}.space-y-2>*+*{margin-top:.5rem}${css}</style></head><body>${resolved}</body></html>`;
}
