import pako from 'pako';
import { restore } from '@orama/plugin-data-persistence';
import { search } from '@orama/orama';
import { pluginEmbeddings } from '@orama/plugin-embeddings';
import '@tensorflow/tfjs-backend-webgl';

const OPENROUTER_EMBEDDINGS_URL = 'https://openrouter.ai/api/v1/embeddings';
const dbCache = new Map();

function decompressGzip(compressedData) {
  const bytes = compressedData instanceof ArrayBuffer
    ? new Uint8Array(compressedData)
    : new Uint8Array(compressedData);
  return pako.ungzip(bytes, { to: 'uint8array' });
}

function isLikelyHex(bytes, sampleSize = 4096) {
  const len = Math.min(bytes.length, sampleSize);
  if (!len) return false;
  for (let i = 0; i < len; i += 1) {
    const c = bytes[i];
    const isHex = (c >= 48 && c <= 57) || (c >= 97 && c <= 102);
    const isWhitespace = c === 10 || c === 13 || c === 9 || c === 32;
    if (!isHex && !isWhitespace) return false;
  }
  return true;
}

async function getQueryEmbedding(query, apiKey, modelId) {
  if (!apiKey) throw new Error('Missing API key for embedding model');
  const response = await fetch(OPENROUTER_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: modelId, input: query })
  });
  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`Embeddings API error: ${response.status} ${err}`);
  }
  const data = await response.json();
  const embedding = data?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) throw new Error('Invalid embedding response');
  return embedding;
}

/**
 * Public API: Initialize Orama DB from a .zip file and load it.
 * @param {string} dbFile - Path to the gzipped .zip file (served from public/)
 * @param {string} embeddingModel - 'orama' | 'openai' (orama = plugin embeddings, openai = precomputed vectors)
 * @returns {Promise<object>} Orama database instance
 */
export async function initializeOramaDb(dbFile, embeddingModel = 'orama') {
  const cacheKey = `${dbFile}:${embeddingModel}`;
  if (dbCache.has(cacheKey)) {
    return dbCache.get(cacheKey);
  }

  const response = await fetch(`/${dbFile}`);
  if (!response.ok) throw new Error(`Failed to load embeddings file: ${response.status}`);

  const compressedData = await response.arrayBuffer();
  const decompressedBytes = decompressGzip(compressedData);

  let dbInstance;
  const jsonText = new TextDecoder().decode(decompressedBytes);
  try {
    const parsed = JSON.parse(jsonText);
    dbInstance = await restore('binary', parsed);
  } catch {
    if (isLikelyHex(decompressedBytes)) {
      dbInstance = await restore('binary', jsonText);
    } else {
      try {
        dbInstance = await restore('dpack', decompressedBytes);
      } catch {
        dbInstance = await restore('seqproto', decompressedBytes);
      }
    }
  }

  if (embeddingModel === 'orama') {
    const embeddingsPlugin = await pluginEmbeddings({
      embeddings: {
        defaultProperty: 'embedding',
        onInsert: { generate: false, properties: ['text'], verbose: false }
      }
    });
    if (typeof embeddingsPlugin.beforeSearch === 'function') {
      dbInstance.beforeSearch.push(async (...args) => embeddingsPlugin.beforeSearch(...args));
    }
    if (typeof embeddingsPlugin.beforeInsert === 'function') {
      dbInstance.beforeInsert.push(async (...args) => embeddingsPlugin.beforeInsert(...args));
    }
  }

  dbCache.set(cacheKey, dbInstance);
  return dbInstance;
}

/**
 * Public API: Search Orama DB.
 * @param {string} query - Search query
 * @param {object} options - { dbInstance, limit?, similarity?, embeddingModel?, apiKey?, modelId? }
 * @returns {Promise<Array>} Hits array
 */
export async function searchOramaDb(query, options = {}) {
  const {
    dbInstance,
    limit = 10,
    similarity = 0.85,
    embeddingModel = 'orama',
    apiKey,
    modelId
  } = options;

  if (!dbInstance) throw new Error('Database instance not initialized');

  if (embeddingModel === 'orama') {
    const results = await search(dbInstance, {
      mode: 'hybrid',
      term: query,
      limit,
      similarity
    });
    return results.hits.map(hit => ({
      id: hit.document.id,
      text: hit.document.text,
      url: hit.document.url,
      score: hit.score
    }));
  }

  const vector = await getQueryEmbedding(query, apiKey, modelId);
  const results = await search(dbInstance, {
    mode: 'vector',
    vector: { value: vector, property: 'embedding' },
    limit,
    similarity
  });
  return results.hits.map(hit => ({
    id: hit.document.id,
    text: hit.document.text,
    url: hit.document.url,
    score: hit.score
  }));
}
