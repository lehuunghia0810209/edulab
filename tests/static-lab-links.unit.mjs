import assert from 'node:assert/strict';
import test from 'node:test';
import { staticLabLinks } from '../vite.config.js';

const links = {
  VITE_CHEMLAB_URL: 'https://chemlab-edulab.pages.dev/',
  VITE_PHYSICSLAB_URL: 'https://physicslab-edulab.pages.dev/',
  VITE_MATHLAB_URL: 'https://mathlab-edulab.pages.dev/',
  VITE_BIOLAB_URL: 'https://biolab-edulab.pages.dev/',
  VITE_ITLAB_URL: 'https://it-edulab.pages.dev/',
};

test('static Lab links use the established defaults when JavaScript is unavailable', () => {
  const html = Object.keys(links)
    .map((key) => `<span data-lab-url="${key}">${key}</span>`)
    .concat('<span data-lab-url="VITE_EXA_URL">Exa</span>')
    .join('');
  const transformed = staticLabLinks({}).transformIndexHtml(html);

  for (const [key, url] of Object.entries(links)) {
    assert.ok(transformed.includes(`<a href="${url}"`), `${key} should have a static link`);
  }
  assert.ok(transformed.includes('<span data-lab-url="VITE_EXA_URL">Exa</span>'));
});

test('valid configured Lab URLs override defaults and escape ampersands', () => {
  const transformed = staticLabLinks({
    VITE_CHEMLAB_URL: 'https://example.org/chem?unit=1&view=lab',
  }).transformIndexHtml('<span data-lab-url="VITE_CHEMLAB_URL">ChemLab</span>');

  assert.equal(
    transformed,
    '<a href="https://example.org/chem?unit=1&amp;view=lab" target="_blank" rel="noopener noreferrer">ChemLab</a>',
  );
});

test('invalid configured Lab URLs remain plain text instead of creating unsafe links', () => {
  const original = '<span data-lab-url="VITE_PHYSICSLAB_URL">PhysicsLab</span>';
  assert.equal(
    staticLabLinks({ VITE_PHYSICSLAB_URL: 'javascript:alert(1)' }).transformIndexHtml(original),
    original,
  );
});
