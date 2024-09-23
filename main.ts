import { Hono } from 'npm:hono'

const app = new Hono()

app.get('/', c => c.text('hello world'))

Deno.serve(app.fetch)
