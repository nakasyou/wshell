import { Hono } from 'npm:hono'
import { serveStatic } from 'npm:hono/deno'
import { stream } from 'npm:hono/streaming'

const app = new Hono()

const shells: Map<string, Deno.Command> = new Map()

app.get('/api/stream', c => {
  c.header('content-type', 'text/event-stream')
  c.header('content-disposition', 'attachment')
  return stream(c, async cb => {
    for (let i = 0; i < 20; i++) {
      await cb.write(new TextEncoder.encode('data: aaa'))
      await cb.sleep(100)
    }
  })
})

app.get('/', serveStatic({ root: './public' }))

Deno.addSignalListener('SIGINT', () => {
  console.log('interrupted!')
})

Deno.serve(app.fetch)
