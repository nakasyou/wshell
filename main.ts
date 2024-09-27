import { Hono } from 'npm:hono'
import { serveStatic } from 'npm:hono/deno'
import { stream } from 'npm:hono/streaming'

const uint8ArrayToB64 = (data: Uint8Array) => btoa([...data].map(n => String.fromCharCode(n)).join(''))
const b64ToUint8Array = (data: string) => new Uint8Array([...atob(data)].map(s => s.charCodeAt(0)))

const app = new Hono()

let shellCount = -1

interface StdOutput {
  type: 'err' | 'out'
  data: Uint8Array
}

const shells: Map<string, {
  proc: Deno.ChildProcess
  queues: StdOutput[]
  writer: any
}> = new Map()

app.get('/api/create-shell', async c => {
  const command = new Deno.Command('bash', {
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped'
  })
  const proc = command.spawn()

  shellCount ++
  const id = shellCount.toString()

  const writer = await proc.stdin.getWriter()

  const shell = {
    proc,
    queues: [],
    writer
  }
  shells[id] = shell

  ;(async () => {
    for await (const chunk of proc.stdout) {
      shell.queues.push({
        type: 'out',
        data: chunk
      })
    }
  })()
  ;(async () => {
    for await (const chunk of proc.stderr) {
      shell.queues.push({
        type: 'err',
        data: chunk
      })
    }
  })()

  return c.json({ id })
})

app.get('/api/stdout/:id', async c => {
  const shell = shells[c.req.param('id')]

  const result = shell.queues.map(output => ({
    type: output.type,
    data: uint8ArrayToB64(output.data)
  }))

  shell.queues = []

  return c.json(result)
})

app.post('/api/stdin/:id', async c => {
  const { writer } = shells[c.req.param('id')]

  await writer.write(new Uint8Array(await c.req.arrayBuffer()))

  return c.json({ success: true })
})

app.get('*', serveStatic({ root: './public' }))

Deno.addSignalListener('SIGINT', () => {
  console.log('interrupted!')
})

Deno.serve(app.fetch)
