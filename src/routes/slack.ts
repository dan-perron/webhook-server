import express from 'express'
export const router = express.Router()

router.post('/', async (req, res) => {
  console.log(`Received ${JSON.stringify(req.body, null, 2)} from slack.`)
  if (req.body.type === 'url_verification') {
    res.send(req.body.challenge)
    return
  }
  res.send('Ok\n')
})
