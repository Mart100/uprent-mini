import { writable } from 'svelte/store'
import type { Durations } from '~core/database'

// storage keys (stored in localStorage or extension storage)
const ADDR_KEY = 'uprent-commute-addresses'
const MAX_DUR_KEY = 'uprent-commute-max-durations'

const DEFAULT_MAX_DURATIONS: Durations = {
  walking: 50,
  biking: 40,
  transit: 60,
  driving: 45,
}

export const TRAVEL_MODES: { key: keyof Durations; label: string }[] = [
  { key: 'walking', label: 'Walking' },
  { key: 'biking', label: 'Biking' },
  { key: 'transit', label: 'Transit' },
  { key: 'driving', label: 'Driving' },
]

const isExtension =
  typeof chrome !== 'undefined' &&
  typeof chrome.storage !== 'undefined' &&
  typeof chrome.storage.local !== 'undefined'

function createSyncedStore<T>(
  key: string,
  defaultValue: T,
  messageSuffix: string,
) {
  // Load initial state synchronously for immediate UI feedback
  const getInitial = (): T => {
    if (typeof window === 'undefined' || isExtension) return defaultValue
    const saved = localStorage.getItem(key)
    if (!saved) return defaultValue
    try {
      return JSON.parse(saved)
    } catch {
      return defaultValue
    }
  }

  const store = writable<T>(getInitial())
  let isUpdating = false
  let hasSyncedInitial = false

  const setSilently = (val: T) => {
    isUpdating = true
    store.set(val)
    isUpdating = false
  }

  if (typeof window !== 'undefined') {
    if (isExtension) {
      // Sync from extension storage
      chrome.storage.local.get([key], (result: any) => {
        if (result[key]) setSilently(result[key])
        hasSyncedInitial = true
      })

      // Listen for changes in extension storage
      chrome.storage.onChanged.addListener((changes: any, area: string) => {
        if (area === 'local' && changes[key]) {
          setSilently(changes[key].newValue ?? defaultValue)
        }
      })
    } else {
      // Communication bridge for the main website to talk to the extension
      window.postMessage({ type: `UPRENT_GET_${messageSuffix}` }, '*')

      // If extension doesn't respond, allow local persistence
      setTimeout(() => {
        if (!hasSyncedInitial) hasSyncedInitial = true
      }, 1000)

      // Listen for messages from the extension
      window.addEventListener('message', event => {
        if (event.data?.type === `UPRENT_${messageSuffix}_UPDATED`) {
          setSilently(event.data.payload ?? defaultValue)
          hasSyncedInitial = true
        }
      })

      // Sync across tabs via localStorage (fallback)
      window.addEventListener('storage', (e: StorageEvent) => {
        if (!isUpdating && e.key === key && e.newValue) {
          try {
            setSilently(JSON.parse(e.newValue))
          } catch {}
        }
      })
    }

    // Persist changes
    store.subscribe(val => {
      if (isUpdating || typeof val === 'undefined') return

      if (isExtension) {
        if (hasSyncedInitial) {
          chrome.storage.local.set({ [key]: val })
        }
      } else {
        if (hasSyncedInitial) {
          window.postMessage(
            { type: `UPRENT_SET_${messageSuffix}`, payload: val },
            '*',
          )
        }
        localStorage.setItem(key, JSON.stringify(val))
      }
    })
  }

  return store
}

// Shared stores for all instances on the same page
export const addresses = createSyncedStore<string[]>(ADDR_KEY, [], 'ADDRESSES')
export const maxDurations = createSyncedStore<Durations>(
  MAX_DUR_KEY,
  DEFAULT_MAX_DURATIONS,
  'MAX_DURATIONS',
)
