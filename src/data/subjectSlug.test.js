import { describe, expect, it } from 'vitest'
import { subjectToChunkBasename } from './subjectSlug'

describe('subjectToChunkBasename', () => {
  it('slugifies Turkish lesson names for chunk filenames', () => {
    expect(subjectToChunkBasename('Kadın Hastalıkları ve Doğum')).toBe(
      'kad_n_hastal_klar_ve_dogum'
    )
  })

  it('returns unknown for empty input', () => {
    expect(subjectToChunkBasename('')).toBe('unknown')
  })
})
