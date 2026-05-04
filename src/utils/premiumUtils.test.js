import { describe, expect, it } from 'vitest'
import { getPremiumLabel, isUserPremium } from './premiumUtils'

describe('isUserPremium', () => {
  it('returns false for missing user', () => {
    expect(isUserPremium(null)).toBe(false)
    expect(isUserPremium(undefined)).toBe(false)
  })

  it('returns true for lifetime premium', () => {
    expect(isUserPremium({ lifetimePremium: true })).toBe(true)
  })

  it('returns false when plus plan is expired', () => {
    const past = new Date(Date.now() - 86400000)
    expect(
      isUserPremium({
        plan: 'plus',
        premiumStatus: 'active',
        premiumUntil: past,
      })
    ).toBe(false)
  })

  it('returns true when plus plan is active and date is in the future', () => {
    const future = new Date(Date.now() + 86400000 * 30)
    expect(
      isUserPremium({
        plan: 'plus',
        premiumStatus: 'active',
        premiumUntil: future,
      })
    ).toBe(true)
  })
})

describe('getPremiumLabel', () => {
  it('returns Ücretsiz when no user', () => {
    expect(getPremiumLabel(null)).toBe('Ücretsiz')
  })
})
