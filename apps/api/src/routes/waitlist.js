const { Router } = require('express')
const { z } = require('zod')
const { createWaitlistEntry, findWaitlistEntry } = require('../store')

const schema = z.object({
  contact: z.string().min(1),
}).transform(({ contact }) => {
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRe = /^\+?[\d\s\-().]{7,20}$/
  if (emailRe.test(contact)) return { email: contact.toLowerCase(), phone: null }
  if (phoneRe.test(contact)) return { email: null, phone: contact.replace(/\s/g, '') }
  return null
})

function waitlistRouter() {
  const router = Router()

  router.post('/', async (req, res) => {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success || parsed.data === null) {
      return res.status(400).json({ error: 'Please enter a valid email or phone number.' })
    }

    const { email, phone } = parsed.data

    try {
      // Check for existing entry with the same contact
      const existing = await findWaitlistEntry({ email, phone })

      if (existing) {
        return res.json({ status: 'already_joined' })
      }

      await createWaitlistEntry({ email, phone })

      return res.json({ status: 'joined' })
    } catch (err) {
      console.error('[waitlist]', err)
      return res.status(500).json({ error: 'Something went wrong.' })
    }
  })

  return router
}

module.exports = { waitlistRouter }
