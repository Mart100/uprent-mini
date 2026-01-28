export const getCommuteDurations = async () => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'GET_COMMUTE_DURATIONS' }, response => {
      if (chrome.runtime.lastError) {
        return resolve({
          data: null,
          error: chrome.runtime.lastError.message,
        })
      }

      if (!response || !response.ok) {
        return resolve({
          data: null,
          error: response?.error || 'Failed to fetch',
        })
      }

      resolve({
        data: response.data,
        error: null,
      })
    })
  })
}
