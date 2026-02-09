import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// Use the secret you generated
const PROXY_SECRET = "68d850e514267459d6cc90e8af92ea210ffc3b0379c70063c3e64f629042e78e"

app.use('/*', cors())

app.all('/bakong/*', async (c) => {
  // 1. Security Check
  if (c.req.header('X-Proxy-Auth') !== PROXY_SECRET) {
    return c.json({ error: 'Unauthorized Proxy Access' }, 401)
  }

  const path = c.req.path.replace('/bakong', '')
  const targetUrl = `https://api-bakong.nbc.gov.kh${path}`
  
  // 2. Setup Stealth Headers to trick CloudFront
  const headers = new Headers()
  headers.set('Host', 'api-bakong.nbc.gov.kh')
  headers.set('Accept', 'application/json')
  headers.set('Content-Type', 'application/json')
  headers.set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36')

  // Forward the Bakong Token from Python
  const auth = c.req.header('Authorization')
  if (auth) headers.set('Authorization', auth)

  try {
    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers: headers,
      body: c.req.method !== 'GET' ? await c.req.text() : undefined
    })

    return new Response(response.body, response)
  } catch (err: any) {
    return c.json({ error: 'Bakong Connection Failed', details: err.message }, 502)
  }
})

export default app