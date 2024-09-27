import { Hono } from 'npm:hono'
import { serveStatic } from 'npm:hono/deno'
import { stream } from 'npm:hono/streaming'

const app = new Hono()

const shells: Map<string, {
  proc: Deno.ChildProcess
  queues: {
    stderr: Uint8Array
    stdout: Uint8Array
  }
}> = new Map()

app.get('/api/create-shell', async c => {
  const command = new Deno.Command('bash')
  const proc = command.spawn()

  const id = crypto.randomUUID()

  const queues = {
    stderr: new Uint8Array(),
    stdout: new Uint8Array()
  }

  shells[id] = {
    proc,
    queues
  }

  ;(async () => {
    for await (const chunk of proc.stdout) {
      queues.stdout = [...queues.stdout, chunk]
    }
  })()

  return c.json({ id })
})

app.get('/api/get-shell/:id', async c => {
  const { queues } = shells[c.req.param('id')]

  return c.json({ stdout: [...queues.stdout].join(' ') })
})

app.get('/api/stream', c => {
  c.header('content-type', 'text/event-stream')
  c.header('content-disposition', 'attachment')
  return stream(c, async cb => {
    for (let i = 0; i < 50; i++) {
      await cb.write(new TextEncoder().encode('data: aaa\n\n'))
      await cb.sleep(100)
    }
    console.log('closing')
    await cb.close()
  })
})

app.get('/', serveStatic({ root: './public' }))

Deno.addSignalListener('SIGINT', () => {
  console.log('interrupted!')
})

Deno.serve(app.fetch)
