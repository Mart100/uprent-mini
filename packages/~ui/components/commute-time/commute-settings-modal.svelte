<script lang="ts">
  import { get } from 'svelte/store'
  import type { Durations } from '~core/database'
  import { XSVG, MapPinSVG, WalkSVG, BikeSVG, BusSVG, CarSVG } from '~ui/assets'
  import { Button } from '~ui/components'
  import { addresses, maxDurations } from './store'

  export let show = false

  let localAddresses: string[] = []
  let localMaxDurations: Durations = {
    walking: 0,
    biking: 0,
    transit: 0,
    driving: 0,
  }

  let initialized = false

  $: if (show && !initialized) {
    localAddresses = [...get(addresses)]
    localMaxDurations = { ...get(maxDurations) }
    initialized = true
  }

  $: if (!show) {
    initialized = false
  }

  let tempAddress = ''
  let suggestionsVisible = false

  const MOCK_ADDRESSES = [
    'Prinsengracht 123, Amsterdam',
    'Keizersgracht 456, Amsterdam',
    'De Pijp, Amsterdam',
    'Jordaan, Amsterdam',
    'Buitenveldert, Amsterdam',
    'Amstelveen, Amsterdam',
    'Utrecht Centraal, Utrecht',
    'Rotterdam Blaak, Rotterdam',
  ]

  $: filteredSuggestions = MOCK_ADDRESSES.filter(a =>
    a.toLowerCase().includes(tempAddress.toLowerCase()),
  )

  const addAddress = () => {
    if (tempAddress.trim() && localAddresses.length < 2) {
      localAddresses = [...localAddresses, tempAddress.trim()]
      tempAddress = ''
      suggestionsVisible = false
    }
  }

  const removeAddress = (index: number) => {
    localAddresses = localAddresses.filter((_, i) => i !== index)
  }

  const selectSuggestion = (s: string) => {
    tempAddress = s
    addAddress()
  }

  const save = () => {
    addresses.set(localAddresses)
    maxDurations.set(localMaxDurations)
    close()
  }

  const close = () => {
    show = false
    tempAddress = ''
    suggestionsVisible = false
  }
</script>

{#if show}
  <div
    class=".fixed .inset-0 .z-[9999] .flex .items-center .justify-center .p-4"
  >
    <div
      class=".absolute .inset-0 .bg-black/50"
      aria-hidden="true"
      on:click={close}
    ></div>
    <div class=".relative .w-full .max-w-md .rounded-2xl .bg-white .shadow-2xl">
      <div
        class=".flex .items-center .justify-between .border-b .border-black-100 .p-6"
      >
        <h3 class=".text-black-900 .text-lg .font-bold">Commute Settings</h3>
        <button
          class=".text-black-400 hover:.bg-black-50 .rounded-full .p-1"
          on:click={close}
        >
          <XSVG class=".h-6 .w-6" />
        </button>
      </div>

      <div class=".max-h-[80vh] .overflow-y-auto .p-6">
        <!-- Destinations Section -->
        <div class=".mb-8">
          <div class=".mb-4">
            <h4 class=".text-black-900 .text-sm .font-bold">Destinations</h4>
            <p class=".text-black-500 .text-xs">
              Add up to 2 locations to see commute times from properties.
            </p>
          </div>

          <div class=".flex .flex-col .gap-3">
            {#each localAddresses as address, i}
              <div
                class=".bg-black-50 .flex .items-center .justify-between .gap-3 .rounded-xl .border .border-solid .border-black-100 .p-3"
              >
                <div class=".flex .min-w-0 .items-center .gap-2">
                  <MapPinSVG class=".h-4 .w-4 .shrink-0 .text-primary" />
                  <span class=".text-black-900 .truncate .text-sm .font-medium"
                    >{address}</span
                  >
                </div>
                <button
                  class=".p-1 .text-black-300 .transition-colors hover:.text-red-error"
                  on:click={() => removeAddress(i)}
                  title="Remove"
                >
                  <XSVG class=".h-4 .w-4" />
                </button>
              </div>
            {/each}

            {#if localAddresses.length < 2}
              <div class=".relative .mt-1">
                <div class=".flex .gap-2">
                  <input
                    type="text"
                    bind:value={tempAddress}
                    placeholder="Type an address..."
                    class=".flex-1 .rounded-xl .border .border-black-200 .px-4 .py-3 .text-sm .outline-none .ring-4 .ring-transparent .transition-all focus:.border-primary focus:.ring-primary/20"
                    on:focus={() => (suggestionsVisible = true)}
                    on:keydown={e => e.key === 'Enter' && addAddress()}
                  />
                </div>

                {#if suggestionsVisible && filteredSuggestions.length > 0}
                  <div
                    class=".absolute .left-0 .top-full .z-10 .mt-2 .max-h-52 .w-full .overflow-auto .rounded-xl .border .border-black-100 .bg-white .shadow-xl"
                  >
                    {#each filteredSuggestions as s}
                      <button
                        class=".text-black-700 hover:.bg-primary-50 .flex .w-full .items-center .gap-3 .px-4 .py-3 .text-left .text-sm .transition-colors hover:.text-primary"
                        on:click={() => selectSuggestion(s)}
                      >
                        <MapPinSVG class=".h-4 .w-4 .shrink-0" />
                        <span class=".truncate">{s}</span>
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>

        <!-- Max Durations Section -->
        <div class=".border-t .border-black-100 .pt-6">
          <div class=".mb-5">
            <h4 class=".text-black-900 .text-sm .font-bold">
              Maximum acceptable travel time (mins)
            </h4>
            <p class=".text-black-500 .mt-1 .text-[11px]">
              We'll highlight travel times that exceed your limits.
            </p>
          </div>

          <div class=".grid .grid-cols-2 .gap-4">
            <div class=".flex .flex-col .gap-1.5">
              <div class=".text-black-500 .flex .items-center .gap-1.5">
                <WalkSVG class=".h-3.5 .w-3.5" />
                <label
                  for="max-walk"
                  class=".text-[10px] .font-bold .uppercase .tracking-wider"
                  >Walking</label
                >
              </div>
              <input
                id="max-walk"
                type="number"
                bind:value={localMaxDurations.walking}
                min="1"
                class=".w-full .rounded-lg .border .border-black-200 .px-3 .py-2 .text-sm .outline-none focus:.border-primary"
              />
            </div>

            <div class=".flex .flex-col .gap-1.5">
              <div class=".text-black-500 .flex .items-center .gap-1.5">
                <BikeSVG class=".h-3.5 .w-3.5" />
                <label
                  for="max-bike"
                  class=".text-[10px] .font-bold .uppercase .tracking-wider"
                  >Biking</label
                >
              </div>
              <input
                id="max-bike"
                type="number"
                bind:value={localMaxDurations.biking}
                min="1"
                class=".w-full .rounded-lg .border .border-black-200 .px-3 .py-2 .text-sm .outline-none focus:.border-primary"
              />
            </div>

            <div class=".flex .flex-col .gap-1.5">
              <div class=".text-black-500 .flex .items-center .gap-1.5">
                <BusSVG class=".h-3.5 .w-3.5" />
                <label
                  for="max-transit"
                  class=".text-[10px] .font-bold .uppercase .tracking-wider"
                  >Transit</label
                >
              </div>
              <input
                id="max-transit"
                type="number"
                bind:value={localMaxDurations.transit}
                min="1"
                class=".w-full .rounded-lg .border .border-black-200 .px-3 .py-2 .text-sm .outline-none focus:.border-primary"
              />
            </div>

            <div class=".flex .flex-col .gap-1.5">
              <div class=".text-black-500 .flex .items-center .gap-1.5">
                <CarSVG class=".h-3.5 .w-3.5" />
                <label
                  for="max-drive"
                  class=".text-[10px] .font-bold .uppercase .tracking-wider"
                  >Driving</label
                >
              </div>
              <input
                id="max-drive"
                type="number"
                bind:value={localMaxDurations.driving}
                min="1"
                class=".w-full .rounded-lg .border .border-black-200 .px-3 .py-2 .text-sm .outline-none focus:.border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      <div class=".flex .justify-end .border-t .border-black-100 .p-4">
        <Button primary onClick={save} class=".w-full sm:.w-auto">
          Save Changes
        </Button>
      </div>
    </div>
  </div>
{/if}

<style>
  * {
    box-sizing: border-box;
    font-family: inherit;
  }

  p {
    margin: 0;
  }

  input {
    font-family: inherit;
    border-style: solid;
  }

  button {
    font-family: inherit;
    border: none;
    background: none;
    cursor: pointer;
  }
</style>
