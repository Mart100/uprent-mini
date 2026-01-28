<script lang="ts">
  import api from '~api'
  import type { Durations } from '~core/database'
  import {
    RouteSVG,
    WalkSVG,
    BikeSVG,
    BusSVG,
    CarSVG,
    RefreshSVG,
  } from '~ui/assets'
  import { Button } from '~ui/components'

  let loading = false
  let durations: Durations | null = null

  const load = async () => {
    loading = true
    const { data, error } = await api.commute.durations.get()
    loading = false

    if (error || data.status === 'error') {
      console.error('Failed to load commute durations', error || data.message)
      return
    }

    durations = data.payload.durations
  }

  const formatTime = (mins: number | null | undefined) => {
    if (mins === null || mins === undefined) return '-'
    if (mins < 60) return `${mins}m`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
</script>

<div>
  {#if !durations}
    <Button primary {loading} onClick={load}>
      <RouteSVG slot="icon" />
      Calculate Commute
    </Button>
  {:else}
    <div class=".flex .flex-wrap .items-center .gap-4 .px-3 .py-2">
      <div class=".flex .items-center .gap-1.5" title="Walking">
        <WalkSVG class=".text-black-500 .h-4 .w-4" />
        <span class=".text-black-900 .text-sm .font-medium"
          >{formatTime(durations.walking)}</span
        >
      </div>

      <div class=".flex .items-center .gap-1.5" title="Biking">
        <BikeSVG class=".text-black-500 .h-4 .w-4" />
        <span class=".text-black-900 .text-sm .font-medium"
          >{formatTime(durations.biking)}</span
        >
      </div>

      <div class=".flex .items-center .gap-1.5" title="Transit">
        <BusSVG class=".text-black-500 .h-4 .w-4" />
        <span class=".text-black-900 .text-sm .font-medium"
          >{formatTime(durations.transit)}</span
        >
      </div>

      <div class=".flex .items-center .gap-1.5" title="Driving">
        <CarSVG class=".text-black-500 .h-4 .w-4" />
        <span class=".text-black-900 .text-sm .font-medium"
          >{formatTime(durations.driving)}</span
        >
      </div>
    </div>
  {/if}
</div>
