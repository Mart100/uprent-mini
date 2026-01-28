const ADDR_KEY = 'uprent-commute-addresses'

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

    if (type === 'UPRENT_SET_ADDRESSES') {
      chrome.storage.local.set({ [ADDR_KEY]: payload })
    }
  })

  // Listen for changes in extension storage and notify the website
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[ADDR_KEY]) {
      window.postMessage(
        {
          type: 'UPRENT_ADDRESSES_UPDATED',
          payload: changes[ADDR_KEY].newValue || [],
        },
        '*',
      )
    }
  })
}
