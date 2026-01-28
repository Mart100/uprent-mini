import { app, res } from '@/handler'
import { t, DurationsSchema } from '@schemas'
import type { Durations } from '~core/database'
import { randomInt } from '~core/helpers'

const resDTO = t.Object({
  results: t.Record(t.String(), DurationsSchema),
})

export const commuteDurationsEndpointHandler = app.get(
  '/durations',
  ({ query, res }) => {
    // Split by pipe to avoid comma conflicts in addresses
    const addressList = query.addresses?.split('|').filter(Boolean) || []

    const results: Record<string, Durations> = {}

    for (const address of addressList) {
      // Generate mock durations
      results[address] = {
        walking: randomInt(45, 120),
        biking: randomInt(25, 90),
        driving: randomInt(10, 60),
        transit: randomInt(10, 60),
      }
    }

    return res.ok({
      results,
    })
  },
  {
    query: t.Object({
      addresses: t.Optional(t.String()),
    }),
    response: res(resDTO),
  },
)
