import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export const NOTION_VERSION = '2022-06-28';
export const REQUEST_DELAY_MS = 300;

export function loadEnv() {
  const load = (path) => {
    if (!existsSync(path)) return {};
    const out = {};
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    }
    return out;
  };
  const merge = (...maps) => {
    const out = {};
    for (const m of maps) {
      for (const [k, v] of Object.entries(m)) {
        if (!v || String(v).includes('PEGA_')) continue;
        out[k] = v;
      }
    }
    return out;
  };
  return merge(
    load(resolve(root, '.env')),
    load(resolve(root, '.env.notion')),
    load(resolve(root, '.env.selfhosted')),
    load(resolve(root, '.env.contabo')),
    load(resolve(root, '.env.i18n')),
    load(resolve(root, 'env.i18n')),
    load(resolve(root, 'config/traduccion-api-keys.env')),
    load(resolve(root, 'accesos-bepelican.env')),
    process.env
  );
}

export function loadNotionDatabaseIds() {
  const statePath = resolve(root, 'notion-templates/.notion-import.json');
  if (!existsSync(statePath)) {
    throw new Error('Falta notion-templates/.notion-import.json — corré npm run notion:import primero.');
  }
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  return state.databaseIds;
}

let lastRequest = 0;

export function createNotionClient(token) {
  async function notion(method, path, body) {
    const wait = REQUEST_DELAY_MS - (Date.now() - lastRequest);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));

    const res = await fetch(`https://api.notion.com/v1${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    lastRequest = Date.now();
    const data = await res.json();
    if (!res.ok) throw new Error(`Notion API ${res.status}: ${data.message || res.statusText}`);
    return data;
  }

  async function queryDatabase(databaseId) {
    const pages = [];
    let cursor;
    do {
      const body = cursor ? { start_cursor: cursor, page_size: 100 } : { page_size: 100 };
      const res = await notion('POST', `/databases/${databaseId}/query`, body);
      pages.push(...res.results);
      cursor = res.has_more ? res.next_cursor : null;
    } while (cursor);
    return pages;
  }

  async function getBlockChildren(blockId) {
    const blocks = [];
    let cursor;
    do {
      const q = cursor ? `?start_cursor=${cursor}&page_size=100` : '?page_size=100';
      const res = await notion('GET', `/blocks/${blockId}/children${q}`);
      blocks.push(...res.results);
      cursor = res.has_more ? res.next_cursor : null;
    } while (cursor);
    return blocks;
  }

  async function getAllPageBlocks(pageId) {
    const top = await getBlockChildren(pageId);
    const all = [];
    for (const block of top) {
      all.push(block);
      if (block.has_children && block.type !== 'child_page') {
        const nested = await getBlockChildren(block.id);
        all.push(...nested);
      }
    }
    return all;
  }

  async function appendBlocks(pageId, children) {
    if (!children.length) return;
    await notion('PATCH', `/blocks/${pageId}/children`, { children });
  }

  return { notion, queryDatabase, getAllPageBlocks, appendBlocks, getBlockChildren };
}

export const propTitle = (p) => p?.title?.map((t) => t.plain_text).join('') ?? '';
export const propRichText = (p) => p?.rich_text?.map((t) => t.plain_text).join('') ?? '';
export const propSelect = (p) => p?.select?.name ?? null;
export const propNumber = (p) => (p?.number == null ? null : p.number);
export const propUrl = (p) => p?.url ?? null;

export function blockPlainText(block) {
  const data = block[block.type];
  if (!data) return '';
  if (Array.isArray(data.rich_text)) return data.rich_text.map((t) => t.plain_text).join('');
  if (Array.isArray(data.text)) return data.text.map((t) => t.plain_text).join('');
  return '';
}

const SECTION_KEYS = {
  'descripción completa': 'description',
  'descripcion completa': 'description',
  incluye: 'includes',
  'no incluye': 'not_includes',
  'qué llevar': 'requirements',
  'que llevar': 'requirements',
  requisitos: 'requirements',
  itinerario: 'itinerary',
};

export function parsePageSections(blocks) {
  const out = {
    description: '',
    includes: [],
    not_includes: [],
    requirements: [],
    itinerary: null,
  };

  let section = null;
  let itineraryDays = [];
  let currentDay = null;

  for (const block of blocks) {
    const text = blockPlainText(block).trim();
    if (!text && block.type !== 'bulleted_list_item') continue;

    if (block.type === 'heading_2') {
      section = SECTION_KEYS[text.toLowerCase()] ?? null;
      if (section === 'itinerary') {
        itineraryDays = [];
        currentDay = null;
      }
      continue;
    }

    if (block.type === 'heading_3' && section === 'itinerary') {
      if (currentDay) itineraryDays.push(currentDay);
      const dayMatch = text.match(/d[ií]a\s*(\d+)/i);
      currentDay = {
        dayNumber: dayMatch ? Number(dayMatch[1]) : itineraryDays.length + 1,
        title: text.replace(/^d[ií]a\s*\d+\s*[—\-–:]\s*/i, '').trim() || text,
        activities: [],
      };
      continue;
    }

    if (section === 'description') {
      if (block.type === 'paragraph' || block.type === 'bulleted_list_item') {
        out.description += (out.description ? '\n' : '') + text;
      }
    }

    if (section === 'includes' && block.type === 'bulleted_list_item' && text) {
      out.includes.push(text);
    }
    if (section === 'not_includes' && block.type === 'bulleted_list_item' && text) {
      out.not_includes.push(text);
    }
    if (section === 'requirements' && block.type === 'bulleted_list_item' && text) {
      out.requirements.push(text);
    }
    if (section === 'itinerary' && block.type === 'bulleted_list_item' && text && currentDay) {
      currentDay.activities.push({ description: text });
    }
  }

  if (currentDay) itineraryDays.push(currentDay);
  if (itineraryDays.length) out.itinerary = itineraryDays;
  return out;
}

export function richText(content) {
  const chunks = String(content || '').match(/.{1,2000}/g) || [];
  return chunks.map((c) => ({ type: 'text', text: { content: c } }));
}

export function heading2(text) {
  return { object: 'block', type: 'heading_2', heading_2: { rich_text: richText(text) } };
}

export function heading3(text) {
  return { object: 'block', type: 'heading_3', heading_3: { rich_text: richText(text) } };
}

export function paragraph(text) {
  return { object: 'block', type: 'paragraph', paragraph: { rich_text: richText(text) } };
}

export function bullet(text) {
  return { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: richText(text) } };
}

export function divider() {
  return { object: 'block', type: 'divider', divider: {} };
}
