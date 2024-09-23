import { Hono } from 'npm:hono'
import { serveStatic } from 'npm:hono/deno'
import { streamSSE } from 'npm:hono/streaming'

const app = new Hono()

const shells: Map<string, Deno.Command> = new Map()

app.get('/api/stream', c => {
  return streamSSE(c, async cb => {
    while (true) {
      const message = `It is ${new Date().toISOString()}`
      await stream.writeSSE({
        data: message,
        event: 'time-update',
        id: String(id++),
      })
      await stream.sleep(1000)
    }
  })
})

app.get('/', serveStatic({ root: './public' }))

Deno.addSignalListener('SIGINT', () => {
  console.log('interrupted!')
})

Deno.serve(app.fetch)
