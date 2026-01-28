<script lang="ts">
  import api from '~api'
  import type { Durations } from '~core/database'
  import {
    RouteSVG,
    WalkSVG,
    BikeSVG,
    BusSVG,
    CarSVG,
    PlusSVG,
    XSVG,
    MapPinSVG,
  } from '~ui/assets'
  import { Button } from '~ui/components'
  import { addresses } from './store'
  import DestinationModal from './destination-modal.svelte'

  let loading = false
  let durationsMap: Record<string, Durations> = {}
  let showModal = false
  let showResults = false

  const removeAddress = (index: number) => {
    const addr = $addresses[index]
    addresses.update(items => items.filter((_, i) => i !== index))

    const newMap = { ...durationsMap }
    delete newMap[addr]
    durationsMap = newMap

    if ($addresses.length === 0) {
      showResults = false
    }
  }

  const load = async (address: string) => {
    const { data, error } = await api.commute.durations.get()

    if (error || data.status === 'error') {
      console.error('Failed to load commute durations', error || data.message)
      return
    }

    durationsMap = {
      ...durationsMap,
      [address]: data.payload.durations,
    }
  }

  const loadAll = async () => {
    if ($addresses.length === 0) {
      showModal = true
      return
    }

    loading = true
    await Promise.all($addresses.map(addr => load(addr)))
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
</script>

<div class=".flex .max-w-80 .flex-col .gap-3">
  {#if !showResults || $addresses.length === 0}
    <Button primary {loading} onClick={handleCalculateClick} class=".w-full">
      <RouteSVG slot="icon" />
      Calculate Commutes
    </Button>
  {:else}
    <div class=".flex .flex-col .gap-2">
      {#each $addresses as address, i}
        <div class=".bg-black-50 .flex .flex-col .gap-2 .rounded-lg .p-3">
          <div class=".flex .items-center .justify-between .gap-2">
            <div class=".flex .min-w-0 .items-center .gap-1.5">
              <MapPinSVG class=".h-4 .w-4 .shrink-0 .text-primary" />
              <span class=".text-black-900 .truncate .text-sm .font-medium"
                >{address}</span
              >
            </div>
            <button
              class=".rounded-md .p-0.5 .text-black-300 .transition-colors .duration-150 hover:.text-primary"
              on:click={() => removeAddress(i)}
              title="Remove destination"
            >
              <XSVG class=".h-3.5 .w-3.5 .text-current" />
            </button>
          </div>

          {#if durationsMap[address]}
            <div
              class=".flex .flex-wrap .items-center .gap-3 .border-t .border-black-100 .pt-2"
            >
              <div class=".flex .items-center .gap-1.5" title="Walking">
                <WalkSVG class=".text-black-500 .h-3.5 .w-3.5" />
                <span class=".text-black-900 .text-xs .font-medium"
                  >{formatTime(durationsMap[address].walking)}</span
                >
              </div>
              <div class=".flex .items-center .gap-1.5" title="Biking">
                <BikeSVG class=".text-black-500 .h-3.5 .w-3.5" />
                <span class=".text-black-900 .text-xs .font-medium"
                  >{formatTime(durationsMap[address].biking)}</span
                >
              </div>
              <div class=".flex .items-center .gap-1.5" title="Transit">
                <BusSVG class=".text-black-500 .h-3.5 .w-3.5" />
                <span class=".text-black-900 .text-xs .font-medium"
                  >{formatTime(durationsMap[address].transit)}</span
                >
              </div>
              <div class=".flex .items-center .gap-1.5" title="Driving">
                <CarSVG class=".text-black-500 .h-3.5 .w-3.5" />
                <span class=".text-black-900 .text-xs .font-medium"
                  >{formatTime(durationsMap[address].driving)}</span
                >
              </div>
            </div>
          {:else}
            <div
              class=".flex .items-center .gap-2 .border-t .border-black-100 .pt-2"
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

      {#if $addresses.length < 2}
        <div class=".mt-1 .px-1">
          <button
            class="hover:.text-primary-600 .flex .items-center .gap-1 .text-xs .font-medium .text-primary .transition-colors"
            on:click={() => (showModal = true)}
          >
            <PlusSVG class=".h-3.5 .w-3.5" />
            Add destination
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<DestinationModal bind:show={showModal} onAdd={loadAll} />

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

  input {
    font: inherit;
    color: inherit;
    outline: none;
  }
</style>
