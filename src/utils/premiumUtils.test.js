import { afterEach, describe, expect, it } from 'vitest'
import {
  getPremiumLabel,
  hasPlusAccess,
  isUserPremium,
  isWebFreeAccessActive,
} from './premiumUtils'

const CAMPAIGN = {
  enabled: true,
  startsAt: '2026-09-15T00:00:00+03:00',
  endsAt: '2026-10-31T23:59:59+03:00',
}

describe('isWebFreeAccessActive', () => {
  afterEach(() => {
    delete globalThis.window?.Capacitor
  })

  it('returns true inside the campaign window on web', () => {
    expect(isWebFreeAccessActive(new Date('2026-10-01T12:00:00+03:00'), CAMPAIGN)).toBe(true)
  })

  it('returns false before start and after end', () => {
    expect(isWebFreeAccessActive(new Date('2026-09-14T23:59:00+03:00'), CAMPAIGN)).toBe(false)
    expect(isWebFreeAccessActive(new Date('2026-11-01T00:00:00+03:00'), CAMPAIGN)).toBe(false)
  })

  it('returns false when disabled', () => {
    expect(
      isWebFreeAccessActive(new Date('2026-10-01T12:00:00+03:00'), { ...CAMPAIGN, enabled: false })
    ).toBe(false)
  })

  it('never activates inside the native iOS app', () => {
    if (typeof window === 'undefined') globalThis.window = globalThis
    window.Capacitor = { isNativePlatform: () => true }
    expect(isWebFreeAccessActive(new Date('2026-10-01T12:00:00+03:00'), CAMPAIGN)).toBe(false)
  })
})

describe('hasPlusAccess', () => {
  it('stays true for paid Plus users regardless of campaign', () => {
    const future = new Date(Date.now() + 86400000 * 30)
    expect(
      hasPlusAccess({ plan: 'plus', premiumStatus: 'active', premiumUntil: future })
    ).toBe(true)
  })

  it('does not change isUserPremium for free users during the campaign', () => {
    expect(isUserPremium({ plan: 'free' })).toBe(false)
  })
})

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
