const path = require('path')

const Koa = require('koa')
const KoaLogger = require('koa-logger')
const KoaStatic = require('koa-static')
const KoaBody = require('koa-body')
const KoaRouter = require('koa-router')
const requestPromise = require('request-promise-native')
const cheerio = require('cheerio')

const app = new Koa()

app.on('error', err => {
  console.error('Koa error occur:', err)
})

app.use(KoaLogger())
app.use(KoaBody())
app.use(KoaStatic(path.resolve(__dirname, './public')))
const router = new KoaRouter()

router.post('/api/seoRequest', async (ctx, next) => {
  const requestUrl = ctx.request.body.url
  console.log('Request URL:', requestUrl);

  let response = {
    success: false,
    err: '',
    result: {
      robots: {},
      sitemap: {},
      jsonLd: {},
      title: {},
      meta: {},
      imgAlt: {},
      mobile: {},
      ssr: {},
      https: {},
      googleSearch: {},
      naverSearch: {}
    }
  }
  let $ = null

  // html request
  try {
    const htmlString = await requestPromise(requestUrl)
    $ = cheerio.load(htmlString)
    response.success = true
  } catch (err) {
    response.err = '' + err
    ctx.body = JSON.stringify(response)
    return
  }

  // robots
  try {
    const robots = await requestPromise(requestUrl
      + (requestUrl[requestUrl.length - 1] === '/' ? '' : '/')
      + 'robots.txt')

    // TODO parse robots
    response.result.robots.success = true
  } catch (err) {
    response.result.robots.success = false
  }

  // sitemap
  try {
    const robots = await requestPromise(requestUrl
      + (requestUrl[requestUrl.length - 1] === '/' ? '' : '/')
      + 'sitemap.xml')

    // TODO parse sitemap.xml
    response.result.sitemap.success = true
  } catch (err) {
    response.result.sitemap.success = false
  }

  // jsonLd
  if ($('script[type="application/ld+json"]').length > 0) {
    // TODO parse jsonLd
    response.result.jsonLd.success = true
  } else {
    response.result.jsonLd.success = false
  }

  // title
  if ($('title')) {
    // TODO: more
    response.result.title.success = true
  } else {
    response.result.title.success = false
  }

  // meta
  if ($('meta[charset]')) {
    // TODO: more
    response.result.meta.success = true
  } else {
    response.result.meta.success = false
  }

  // imgAlt
  let hasNoAlt = false
  $('image').each((i, e) => {
    if (!e.attr('alt')) {
      hasNoAlt = true
      return false
    }
  })
  if (!hasNoAlt) {
    // TODO: more
    response.result.imgAlt.success = true
  } else {
    response.result.imgAlt.success = false
  }

  // https
  try {
    if (requestUrl.match(/^https:\/\//)) {
      response.result.https.success = true
    } else {
      await requestPromise(requestUrl.replace(/^http:\/\//, 'https://'))
      response.result.https.success = true
    }
  } catch (err) {
    response.result.https.success = false
  }

  ctx.body = JSON.stringify(response)
})

app.use(router.routes())
app.use(router.allowedMethods())

app.listen(3000)
