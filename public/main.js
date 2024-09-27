const uint8ArrayToB64 = (data) => btoa([...data].map(n => String.fromCharCode(n)).join(''))
const b64ToUint8Array = (data) => new Uint8Array([...atob(data)].map(s => s.charCodeAt(0)))

const $stdin = document.getElementById('stdin')
const $shell = document.getElementById('shell')
const $send = document.getElementById('send')

const shellId = (await fetch('/api/create-shell').then(res => res.json())).id

$send.onclick = async () => {
  await fetch(`/api/stdin/${shellId}`, {
    method: 'POST',
    body: $stdin.value
  })
}

const update = async () => {
  console.log(await fetch(`/api/stdout/${shellId}`).then(res => res.json()))
  
  setTimeout(update, 100)
}
update()
