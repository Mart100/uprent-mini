import { parariusManager } from './pararius/manager'
import { initializeExtension } from './init'
import { setupFetchProxy } from './lib/proxy-fetch'

const { host } = window.location

const main = () => {
  setupFetchProxy()

  if (/pararius\./.test(host)) {
    initializeExtension(parariusManager)
    return
  }
}

main()
