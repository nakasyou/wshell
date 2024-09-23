import { Hono } from 'npm:hono'
import { serveStatic } from 'hono/deno'

const app = new Hono()

app.get('/api', c => c.text('hello'))
app.get('/', serveStatic({ root: './public' }))

Deno.serve(app.fetch)
