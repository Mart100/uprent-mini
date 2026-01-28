const ADDR_KEY = 'uprent-commute-addresses'
const MAX_DUR_KEY = 'uprent-commute-max-durations'

export const setupStorageBridge = () => {
  if (typeof window === 'undefined') return

  // Listen for messages from the website
  window.addEventListener('message', async event => {
    const { type, payload } = event.data || {}

    if (type === 'UPRENT_GET_ADDRESSES') {
      chrome.storage.local.get([ADDR_KEY], result => {
        window.postMessage(
          {
            type: 'UPRENT_ADDRESSES_UPDATED',
            payload: result[ADDR_KEY] || [],
          },
          '*',
        )
      })
    }

    if (type === 'UPRENT_GET_MAX_DURATIONS') {
      chrome.storage.local.get([MAX_DUR_KEY], result => {
        window.postMessage(
          {
            type: 'UPRENT_MAX_DURATIONS_UPDATED',
            payload: result[MAX_DUR_KEY] || null,
          },
          '*',
        )
      })
    }

    if (type === 'UPRENT_SET_ADDRESSES') {
      chrome.storage.local.set({ [ADDR_KEY]: payload })
    }

    if (type === 'UPRENT_SET_MAX_DURATIONS') {
      chrome.storage.local.set({ [MAX_DUR_KEY]: payload })
    }
  })

  // Listen for changes in extension storage and notify the website
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes[ADDR_KEY]) {
        window.postMessage(
          {
            type: 'UPRENT_ADDRESSES_UPDATED',
            payload: changes[ADDR_KEY].newValue || [],
          },
          '*',
        )
      }
      if (changes[MAX_DUR_KEY]) {
        window.postMessage(
          {
            type: 'UPRENT_MAX_DURATIONS_UPDATED',
            payload: changes[MAX_DUR_KEY].newValue || null,
          },
          '*',
        )
      }
    }
  })
}
