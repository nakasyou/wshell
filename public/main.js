import { Terminal } from 'https://esm.sh/@xterm/xterm'

const uint8ArrayToB64 = (data) => btoa([...data].map(n => String.fromCharCode(n)).join(''))
const b64ToUint8Array = (data) => new Uint8Array([...atob(data)].map(s => s.charCodeAt(0)))

const $stdin = document.getElementById('stdin')
const $shell = document.getElementById('shell')
const $send = document.getElementById('send')

const term = new Terminal()
term.open($shell)

globalThis.term = term

const shellId = (await fetch('/api/create-shell').then(res => res.json())).id

$send.onclick = async () => {
  await fetch(`/api/stdin/${shellId}`, {
    method: 'POST',
    body: $stdin.value
  })
}

let text = ''

const shellDecoder = new TextDecoder()
const update = async () => {
  const data = await fetch(`/api/stdout/${shellId}`).then(res => res.json())

  for (const output of data) {
    term.write(shellDecoder.decode(b64ToUint8Array(output.data), { stream: true }))
  }
 // $shell.textContent = text
  
  setTimeout(update, 100)
}
update()
