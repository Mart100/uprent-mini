<script lang="ts">
  import { XSVG, MapPinSVG } from '~ui/assets'
  import { Button } from '~ui/components'
  import { addresses } from './store'

  export let show = false
  export let onAdd: () => void

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

  const addAddress = async () => {
    if (tempAddress.trim() && $addresses.length < 2) {
      addresses.update(items => [...items, tempAddress.trim()])
      tempAddress = ''
      show = false
      suggestionsVisible = false
      onAdd()
    }
  }

  const selectSuggestion = (s: string) => {
    tempAddress = s
    addAddress()
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
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class=".absolute .inset-0 .bg-black/50" on:click={close}></div>
    <div
      class=".relative .w-full .max-w-md .rounded-2xl .bg-white .p-6 .shadow-2xl"
    >
      <div class=".mb-6 .flex .items-center .justify-between">
        <div class=".flex .flex-col .gap-1">
          <h3 class=".text-black-900 .text-lg .font-bold">Add destination</h3>
          <p class=".text-black-500 .text-xs .leading-relaxed">
            Enter locations you frequently visit (like your office or gym) to
            see commute times from this property.
          </p>
        </div>
        <button
          class=".text-black-400 hover:.bg-black-50 .self-start .rounded-full .p-1"
          on:click={close}
        >
          <XSVG class=".h-6 .w-6" />
        </button>
      </div>

      <div class=".relative .flex .flex-col .gap-4">
        <div class=".relative">
          <input
            type="text"
            bind:value={tempAddress}
            placeholder="Type an address..."
            class=".w-full .rounded-xl .border .border-black-200 .p-4 .text-sm .outline-none .ring-4 .ring-transparent .transition-all focus:.border-primary focus:.ring-primary/20"
            on:focus={() => (suggestionsVisible = true)}
            on:keydown={e => e.key === 'Enter' && addAddress()}
          />

          {#if suggestionsVisible && filteredSuggestions.length > 0}
            <div
              class=".absolute .left-0 .top-full .z-10 .mt-2 .max-h-60 .w-full .overflow-auto .rounded-xl .border .border-black-100 .bg-white .shadow-xl"
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

        <Button
          primary
          class=".w-full"
          onClick={addAddress}
          disabled={!tempAddress.trim() || $addresses.length >= 2}
        >
          Save destination
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
