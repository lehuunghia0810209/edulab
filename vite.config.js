import { loadEnv } from 'vite';

function staticLabLinks(env) {
  return {
    name: 'static-lab-links',
    transformIndexHtml(html) {
      return html.replace(/<span data-lab-url="(VITE_[A-Z]+_URL)">(.*?)<\/span>/g, function(full, key, label) {
        const value = env[key];
        if (!value) return full;
        try {
          const url = new URL(value);
          if (url.protocol !== 'http:' && url.protocol !== 'https:') return full;
          return `<a href="${url.href.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">${label.replace(' — Chưa cập nhật liên kết', key === 'VITE_EXA_URL' ? '' : ' — Khám phá Lab')}</a>`;
        } catch {
          return full;
        }
      });
    },
  };
}

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [staticLabLinks(env)],
    base: env.VITE_BASE_PATH || '/',
    publicDir: 'public',
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
  };
};
