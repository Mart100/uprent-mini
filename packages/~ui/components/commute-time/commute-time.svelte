<script lang="ts">
  import api from '~api'
  import type { Durations } from '~core/database'
  import {
    RouteSVG,
    WalkSVG,
    BikeSVG,
    BusSVG,
    CarSVG,
    XSVG,
    MapPinSVG,
    SettingsSVG,
  } from '~ui/assets'
  import { Button } from '~ui/components'
  import { addresses, maxDurations, TRAVEL_MODES } from './store'
  import SettingsModal from './commute-settings-modal.svelte'

  let loading = false
  let durationsMap: Record<string, Durations> = {}
  let showModal = false
  let showResults = false

  const ICON_MAP = {
    walking: WalkSVG,
    biking: BikeSVG,
    transit: BusSVG,
    driving: CarSVG,
  }

  $: {
    if ($addresses.length === 0) {
      showResults = false
    }

    // Automatically load data for new addresses if we are already showing results
    if (showResults) {
      const missing = $addresses.filter(addr => !durationsMap[addr])
      if (missing.length > 0) {
        loadBatch(missing)
      }
    }

    // Clean up durations for removed addresses
    const currentAddresses = Object.keys(durationsMap)
    if (currentAddresses.some(addr => !$addresses.includes(addr))) {
      const newMap = { ...durationsMap }
      currentAddresses.forEach(addr => {
        if (!$addresses.includes(addr)) delete newMap[addr]
      })
      durationsMap = newMap
    }
  }

  const loadBatch = async (addressList: string[]) => {
    const { data, error } = await api.commute.durations.get({
      $query: { addresses: addressList.join('|') },
    })

    if (error || data.status === 'error') {
      console.error('Failed to load commute durations', error || data.message)
      return
    }

    durationsMap = {
      ...durationsMap,
      ...data.payload.results,
    }
  }

  const load = async (address: string) => {
    await loadBatch([address])
  }

  const loadAll = async () => {
    if ($addresses.length === 0) {
      showModal = true
      return
    }

    loading = true
    await loadBatch($addresses)
    loading = false
    showResults = true
  }

  const handleCalculateClick = () => {
    if ($addresses.length === 0) {
      showModal = true
    } else {
      loadAll()
    }
  }

  const formatTime = (mins: number | null | undefined) => {
    if (mins === null || mins === undefined) return '-'
    if (mins < 60) return `${mins}m`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  const isExceeding = (
    mode: keyof Durations,
    value: number | null | undefined,
  ) => {
    if (value === null || value === undefined) return false
    const max = $maxDurations[mode]
    return max !== null && value > max
  }
</script>

<div class=".flex .max-w-80 .flex-col .gap-3 .p-5 .pl-0">
  {#if !showResults || $addresses.length === 0}
    <div class=".flex .gap-2">
      <Button primary {loading} onClick={handleCalculateClick} class=".flex-1">
        <RouteSVG slot="icon" />
        Calculate Commutes
      </Button>
    </div>
  {:else}
    <div class=".flex .flex-col .gap-2">
      <div class=".mb-1 .flex .items-center .justify-between .px-1">
        <span
          class=".text-black-400 .text-[10px] .font-bold .uppercase .tracking-wider"
          >Commute times</span
        >
        <button
          class=".text-black-300 .transition-colors hover:.text-primary"
          on:click={() => (showModal = true)}
          title="Settings"
        >
          <SettingsSVG class=".h-4 .w-4" />
        </button>
      </div>

      {#each $addresses as address, i}
        <div class=".bg-black-50 .flex .flex-col .gap-1 .rounded-lg .p-1">
          <div class=".flex .items-center .justify-between .gap-1">
            <div class=".flex .min-w-0 .items-center .gap-1.5">
              <MapPinSVG class=".h-4 .w-4 .shrink-0 .text-primary" />
              <span class=".text-black-900 .truncate .text-sm .font-medium"
                >{address}</span
              >
            </div>
          </div>

          {#if durationsMap[address]}
            <div
              class=".flex .items-center .justify-between .gap-1 .border-0 .border-t .border-solid .border-black-100 .pt-1"
            >
              {#each TRAVEL_MODES as mode}
                {@const value = durationsMap[address][mode.key]}
                {@const exceeding = isExceeding(mode.key, value)}
                <div
                  class=".flex .items-center .gap-1.5"
                  class:.text-red-error={exceeding}
                  class:.text-black-500={!exceeding}
                  title={mode.label}
                >
                  <svelte:component
                    this={ICON_MAP[mode.key]}
                    class=".h-3.5 .w-3.5"
                  />
                  <span
                    class=".text-[10px] .font-medium"
                    class:.text-black-900={!exceeding}
                  >
                    {formatTime(value)}
                  </span>
                </div>
              {/each}
            </div>
          {:else}
            <div
              class=".flex .items-center .gap-1 .border-t .border-black-100 .pt-2"
            >
              <button
                class="hover:.text-primary-600 .flex .items-center .gap-1.5 .text-xs .font-medium .text-primary .transition-colors"
                on:click={() => load(address)}
              >
                <span>Calculate commute</span>
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<SettingsModal bind:show={showModal} />

<style>
  * {
    font-family: 'Poppins', sans-serif;
  }
  button {
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
  }
</style>
