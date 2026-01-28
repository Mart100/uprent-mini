import { writable } from 'svelte/store'
import type { Durations } from '~core/database'

// Persistent storage keys
const ADDR_KEY = 'uprent-commute-addresses'
const MAX_DUR_KEY = 'uprent-commute-max-durations'

const DEFAULT_MAX_DURATIONS: Durations = {
  walking: 50,
  biking: 40,
  transit: 60,
  driving: 45,
}

// Check environment
const isExtension =
  typeof chrome !== 'undefined' &&
  typeof chrome.storage !== 'undefined' &&
  typeof chrome.storage.local !== 'undefined'

// Load initial state synchronously for immediate UI feedback
const getInitialFromLocal = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback
  // In extension mode, localStorage is site-specific and useless for global sync
  if (isExtension) return fallback
  const saved = localStorage.getItem(key)
  if (!saved) return fallback
  try {
    return JSON.parse(saved)
  } catch (e) {
    return fallback
  }
}

// Shared stores for all instances on the same page
export const addresses = writable<string[]>(getInitialFromLocal(ADDR_KEY, []))
export const maxDurations = writable<Durations>(
  getInitialFromLocal(MAX_DUR_KEY, DEFAULT_MAX_DURATIONS),
)

// Initial load
if (typeof window !== 'undefined') {
  let isUpdating = false
  let hasSyncedInitial = false

  // Helper to update store without triggering subscribers' persistence logic
  const silentSet = (store: any, val: any) => {
    isUpdating = true
    store.set(val)
    isUpdating = false
  }

  const syncFromExtension = () => {
    if (isExtension) {
      chrome.storage.local.get([ADDR_KEY, MAX_DUR_KEY], result => {
        if (result[ADDR_KEY]) {
          silentSet(addresses, result[ADDR_KEY])
        }
        if (result[MAX_DUR_KEY]) {
          silentSet(maxDurations, result[MAX_DUR_KEY])
        }
        hasSyncedInitial = true
      })
    } else {
      // Communication bridge for the main website to talk to the extension
      window.postMessage({ type: 'UPRENT_GET_ADDRESSES' }, '*')
      window.postMessage({ type: 'UPRENT_GET_MAX_DURATIONS' }, '*')

      // If extension doesn't respond in 1s, allow local persistence to continue
      setTimeout(() => {
        if (!hasSyncedInitial) hasSyncedInitial = true
      }, 1000)
    }
  }

  syncFromExtension()

  // Handle updates from storage
  if (isExtension) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') {
        if (changes[ADDR_KEY]) {
          silentSet(addresses, changes[ADDR_KEY].newValue || [])
        }
        if (changes[MAX_DUR_KEY]) {
          silentSet(
            maxDurations,
            changes[MAX_DUR_KEY].newValue || DEFAULT_MAX_DURATIONS,
          )
        }
      }
    })
  }

  // Handle messages from the extension (for the main website)
  window.addEventListener('message', event => {
    if (event.data?.type === 'UPRENT_ADDRESSES_UPDATED') {
      silentSet(addresses, event.data.payload || [])
      hasSyncedInitial = true
    }
    if (event.data?.type === 'UPRENT_MAX_DURATIONS_UPDATED') {
      silentSet(maxDurations, event.data.payload || DEFAULT_MAX_DURATIONS)
      hasSyncedInitial = true
    }
  })

  // Subscribe to changes and persist addresses
  addresses.subscribe(val => {
    if (typeof val === 'undefined' || isUpdating) return

    if (isExtension) {
      if (hasSyncedInitial) {
        chrome.storage.local.set({ [ADDR_KEY]: val })
      }
    } else {
      if (hasSyncedInitial) {
        window.postMessage({ type: 'UPRENT_SET_ADDRESSES', payload: val }, '*')
      }
      localStorage.setItem(ADDR_KEY, JSON.stringify(val))
    }
  })

  // Subscribe to changes and persist maxDurations
  maxDurations.subscribe(val => {
    if (typeof val === 'undefined' || isUpdating) return

    if (isExtension) {
      if (hasSyncedInitial) {
        chrome.storage.local.set({ [MAX_DUR_KEY]: val })
      }
    } else {
      if (hasSyncedInitial) {
        window.postMessage(
          { type: 'UPRENT_SET_MAX_DURATIONS', payload: val },
          '*',
        )
      }
      localStorage.setItem(MAX_DUR_KEY, JSON.stringify(val))
    }
  })

  // Sync across tabs via localStorage (fallback)
  window.addEventListener('storage', e => {
    if (isUpdating) return

    if (e.key === ADDR_KEY && e.newValue) {
      try {
        silentSet(addresses, JSON.parse(e.newValue))
      } catch (e) {}
    }
    if (e.key === MAX_DUR_KEY && e.newValue) {
      try {
        silentSet(maxDurations, JSON.parse(e.newValue))
      } catch (e) {}
    }
  })
}
