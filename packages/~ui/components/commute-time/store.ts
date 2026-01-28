import { writable } from 'svelte/store'

// Persistent storage keys
const ADDR_KEY = 'uprent-commute-addresses'

// Check environment
const isExtension =
  typeof chrome !== 'undefined' &&
  typeof chrome.storage !== 'undefined' &&
  typeof chrome.storage.local !== 'undefined'

// Load initial state synchronously for immediate UI feedback
const getInitialFromLocal = (): string[] => {
  if (typeof window === 'undefined') return []
  // In extension mode, localStorage is site-specific and useless for global sync
  if (isExtension) return []
  const saved = localStorage.getItem(ADDR_KEY)
  if (!saved) return []
  try {
    return JSON.parse(saved)
  } catch (e) {
    return []
  }
}

// Shared stores for all instances on the same page
export const addresses = writable<string[]>(getInitialFromLocal())

// Initial load
if (typeof window !== 'undefined') {
  let isUpdating = false
  let hasSyncedInitial = false

  // Helper to update store without triggering subscribers' persistence logic
  const silentSet = (val: string[]) => {
    isUpdating = true
    addresses.set(val)
    isUpdating = false
  }

  const syncFromExtension = () => {
    if (isExtension) {
      chrome.storage.local.get([ADDR_KEY], result => {
        if (result[ADDR_KEY]) {
          silentSet(result[ADDR_KEY])
        }
        hasSyncedInitial = true
      })
    } else {
      // Communication bridge for the main website to talk to the extension
      window.postMessage({ type: 'UPRENT_GET_ADDRESSES' }, '*')

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
      if (area === 'local' && changes[ADDR_KEY]) {
        silentSet(changes[ADDR_KEY].newValue || [])
      }
    })
  }

  // Handle messages from the extension (for the main website)
  window.addEventListener('message', event => {
    if (event.data?.type === 'UPRENT_ADDRESSES_UPDATED') {
      silentSet(event.data.payload || [])
      hasSyncedInitial = true
    }
  })

  // Subscribe to changes and persist
  addresses.subscribe(val => {
    if (typeof val === 'undefined' || isUpdating) return

    // Extension Context: Use chrome storage
    if (isExtension) {
      // CRITICAL: Only write back if we've successfully loaded the initial state
      // to avoid wiping global data with a local empty state on startup
      if (hasSyncedInitial) {
        chrome.storage.local.set({ [ADDR_KEY]: val })
      }
    }
    // Website Context: Use message bridge AND localStorage
    else {
      if (hasSyncedInitial) {
        window.postMessage({ type: 'UPRENT_SET_ADDRESSES', payload: val }, '*')
      }
      localStorage.setItem(ADDR_KEY, JSON.stringify(val))
    }
  })

  // Sync across tabs via localStorage (fallback)
  window.addEventListener('storage', e => {
    if (e.key === ADDR_KEY && e.newValue && !isUpdating) {
      try {
        silentSet(JSON.parse(e.newValue))
      } catch (e) {}
    }
  })
}
