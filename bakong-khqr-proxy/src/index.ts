import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  PROXY_SECRET: string
}
const app = new Hono<{ Bindings: Bindings }>();
app.use('/*', cors())

app.all('/bakong/*', async (c) => {
  const PROXY_SECRET = c.env.PROXY_SECRET
  /* Security Check */
  if (c.req.header('X-Proxy-Auth') !== PROXY_SECRET) {
    console.error("Auth Mismatch:", c.req.header('X-Proxy-Auth'), "vs", PROXY_SECRET);
    return c.json({ error: 'Unauthorized Proxy Access' }, 401)
  }

  const path = c.req.path.replace('/bakong', '')
  const targetUrl = `https://api-bakong.nbc.gov.kh${path}`

  /* Setup Stealth Headers to trick CloudFront */
  const headers = new Headers()
  headers.set('Host', 'api-bakong.nbc.gov.kh')
  headers.set('Accept', 'application/json')
  headers.set('Content-Type', 'application/json')
  headers.set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36')

  /* Forward the Bakong Token from Python */
  const auth = c.req.header('Authorization')
  if (auth) headers.set('Authorization', auth)

  try {
    const body = c.req.method !== 'GET' && c.req.method !== 'HEAD' ? await c.req.text() : undefined

    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers: headers,
      body: body
    })

    return new Response(response.body, response)
  } catch (err: any) {
    return c.json({ error: 'Bakong Connection Failed', details: err.message }, 502)
  }
})

export default app