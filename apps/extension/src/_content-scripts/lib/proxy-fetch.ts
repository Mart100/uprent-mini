export const setupFetchProxy = () => {
  const { fetch: originalFetch } = window

  window.fetch = (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = input.toString()

    // Only proxy requests to local API to bypass CORS
    if (url.includes('localhost')) {
      return new Promise((resolve, reject) => {
        // Convert Headers to plain object for serialization
        const headers =
          init?.headers instanceof Headers
            ? Object.fromEntries((init.headers as any).entries())
            : init?.headers

        chrome.runtime.sendMessage(
          {
            type: 'FETCH_PROXY',
            payload: {
              url,
              options: {
                ...init,
                headers,
              },
            },
          },
          response => {
            if (chrome.runtime.lastError) {
              return reject(new Error(chrome.runtime.lastError.message))
            }

            if (!response || response.error) {
              return reject(new Error(response?.error || 'Unknown proxy error'))
            }

            const body =
              typeof response.data === 'string'
                ? response.data
                : JSON.stringify(response.data)

            const res = new Response(body, {
              status: response.status,
              statusText: response.statusText,
              headers: new Headers(response.headers),
            })

            resolve(res)
          },
        )
      })
    }

    return originalFetch(input, init)
  }) as any
}
