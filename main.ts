import { Hono } from 'npm:hono'
import { serveStatic } from 'npm:hono/deno'
import { streamSSE } from 'npm:hono/streaming'

const app = new Hono()

const shells: Map<string, Deno.Command> = new Map()

app.get('/api/stream', c => {
  return streamSSE(c, async cb => {
    let id = 0
    while (true) {
      const message = `It is ${new Date().toISOString()}`
      await cb.writeSSE({
        data: message,
        event: 'time-update',
        id: String(id++),
      })
      await cb.sleep(1000)
    }
  })
})

app.get('/', serveStatic({ root: './public' }))

Deno.addSignalListener('SIGINT', () => {
  console.log('interrupted!')
})

Deno.serve(app.fetch)
