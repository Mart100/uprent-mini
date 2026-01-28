import { parariusManager } from './pararius/manager'
import { initializeExtension } from './init'
import { setupFetchProxy } from './lib/proxy-fetch'
import { setupStorageBridge } from './lib'

const { host } = window.location

const main = () => {
  setupFetchProxy()
  setupStorageBridge()

  if (/pararius\./.test(host)) {
    initializeExtension(parariusManager)
    return
  }
}

main()
