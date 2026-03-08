import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import { ReadableStream, WritableStream } from 'node:stream/web'
import { gunzipSync, gzipSync } from 'node:zlib'
import { create, insert } from '@orama/orama'
import { persist } from '@orama/plugin-data-persistence'

vi.mock('@tensorflow/tfjs-backend-webgl', () => ({}))

vi.mock('@orama/plugin-embeddings', () => ({
  pluginEmbeddings: vi.fn(async () => ({
    beforeSearch: async (_db, params) => {
      if (params.term && !params.vector) {
        params.vector = { value: new Array(512).fill(0.01), property: 'embedding' }
        params.mode = 'vector'
      }
    },
    beforeInsert: () => {}
  }))
}))

vi.mock('@/stores/settingsStore', () => ({
  $openrouterApiKey: { get: () => 'test-api-key' }
}))

import { ragTools } from '../tools/ragTools'

const ORAMA_SCHEMA = {
  id: 'string',
  pageId: 'string',
  url: 'string',
  text: 'string',
  embedding: 'vector[512]'
}

async function createMinimalOramaFixture() {
  const db = await create({ schema: ORAMA_SCHEMA })
  await insert(db, {
    id: 'test-1',
    pageId: 'page-1',
    url: 'https://example.com/penpot-components',
    text: 'Penpot components and design system',
    embedding: new Array(512).fill(0.01)
  })
  const persistData = await persist(db)
  const jsonString = JSON.stringify(persistData)
  return gzipSync(Buffer.from(jsonString, 'utf8'))
}

function createDecompressionStream() {
  let controller
  const chunks = []
  const readable = new ReadableStream({
    start(c) {
      controller = c
    }
  })
  const writable = new WritableStream({
    write(chunk) {
      chunks.push(Buffer.from(chunk))
    },
    close() {
      const compressed = Buffer.concat(chunks)
      const decompressed = gunzipSync(compressed)
      controller.enqueue(new Uint8Array(decompressed))
      controller.close()
    }
  })

  return { readable, writable }
}

class MockDecompressionStream {
  constructor(format) {
    if (format !== 'gzip') {
      throw new Error(`Unsupported compression format: ${format}`)
    }
    const { readable, writable } = createDecompressionStream()
    this.readable = readable
    this.writable = writable
  }
}

describe('ragTools', () => {
  beforeAll(() => {
    if (!globalThis.DecompressionStream) {
      globalThis.DecompressionStream = MockDecompressionStream
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('penpot-user-guide-rag', () => {
    it('returns ToolResponse with success, message and payload.results', async () => {
      const fileBuffer = await createMinimalOramaFixture()

      global.fetch = vi.fn(async (url) => {
        if (typeof url === 'string' && url.includes('penpotRagToolContents')) {
          return new Response(fileBuffer, { status: 200 })
        }
        return new Response(JSON.stringify({ error: 'Not mocked' }), { status: 404 })
      })

      const tool = ragTools.find(t => t.id === 'penpot-user-guide-rag')
      expect(tool).toBeTruthy()
      expect(tool.function).toBeTypeOf('function')

      const response = await tool.function({ query: 'Penpot components' })

      expect(response).toBeTruthy()
      expect(response).toHaveProperty('success')
      expect(response).toHaveProperty('message')
      expect(response).toHaveProperty('payload')
      expect(response.payload).toHaveProperty('results')
      expect(response.payload.results).toBeInstanceOf(Array)
      expect(response.success).toBe(true)
      expect(response.payload.results.length).toBeGreaterThan(0)

      // Response must be JSON-serializable for AI SDK stream
      expect(() => JSON.stringify(response)).not.toThrow()
      const serialized = JSON.stringify(response)
      const parsed = JSON.parse(serialized)
      expect(parsed.success).toBe(true)
      expect(parsed.payload.results).toBeInstanceOf(Array)

      // Structure expected by ToolCallDetails (filterOutputFields)
      expect(parsed).toHaveProperty('success')
      expect(parsed).toHaveProperty('payload')
    })
  })
})
