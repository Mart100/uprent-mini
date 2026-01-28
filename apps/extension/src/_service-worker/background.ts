chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'FETCH_PROXY') {
    const { url, options } = message.payload

    fetch(url, options)
      .then(async response => {
        let data
        const text = await response.text()
        try {
          data = JSON.parse(text)
        } catch {
          data = text
        }

        sendResponse({
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries((response.headers as any).entries()),
          data,
        })
      })
      .catch(error => {
        sendResponse({
          ok: false,
          error: error.message,
        })
      })

    return true
  }
})
