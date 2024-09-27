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
  writer: any
}> = new Map()

app.get('/api/create-shell', async c => {
  const command = new Deno.Command('bash', {
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped'
  })
  const proc = command.spawn()

  const id = crypto.randomUUID()

  const queues = {
    stderr: new Uint8Array(),
    stdout: new Uint8Array()
  }
  const writer = await proc.stdin.getWriter()

  shells[id] = {
    proc,
    queues,
    writer
  }

  ;(async () => {
    for await (const chunk of proc.stdout) {
      queues.stdout = [...queues.stdout, chunk]
    }
  })()
  ;(async () => {
    for await (const chunk of proc.stderr) {
      queues.stderr = [...queues.stderr, chunk]
    }
  })()

  return c.json({ id })
})

app.get('/api/stdout/:id', async c => {
  const { queues } = shells[c.req.param('id')]

  const result = {
    stdout: [...queues.stdout].join(' '),
    stderr: [...queues.stderr].join(' '),   
  }

  queues.stdout = new Uint8Array()
  queues.stderr = new Uint8Array()

  return c.json(result)
})

app.get('/api/stdin/:id', async c => {
  const { writer } = shells[c.req.param('id')]

  await writer.write(new TextEndoder().encode(c.req.query('d') ?? ''))

  return { success: true }
})

app.get('/', serveStatic({ root: './public' }))

Deno.addSignalListener('SIGINT', () => {
  console.log('interrupted!')
})

Deno.serve(app.fetch)
