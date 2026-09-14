import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Web ücretsiz kampanyası testlerde kapalı: free-limit testleri gerçek tarihe bağlı kalmasın.
vi.mock('../config/freeAccessCampaign', () => ({
  WEB_FREE_ACCESS_CAMPAIGN: { enabled: false, startsAt: null, endsAt: null },
}))
