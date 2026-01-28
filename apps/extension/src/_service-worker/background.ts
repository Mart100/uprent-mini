import api from '~api'

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_COMMUTE_DURATIONS') {
    api.commute.durations
      .get()
      .then(({ data, error }: any) => {
        sendResponse({
          ok: !error && data.status === 'success',
          data: data || null,
          error: error || (data?.status === 'error' ? data.message : null),
        })
      })
      .catch((error: any) => {
        sendResponse({
          ok: false,
          error: error.message,
        })
      })

    return true
  }
})
