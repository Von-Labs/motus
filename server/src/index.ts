import express from 'express'
import chatRouter from './chat/chatRouter'
import imagesRouter from './images/imagesRouter'
import jupiterSwapRouter from './jupiter/swapRouter'
import { sendRouter } from './sends'
import bodyParser from 'body-parser'
import 'dotenv/config'

// Debug: Check if env vars are loaded
console.log('🔑 Environment Check:', {
  hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
  hasJupiterKey: !!process.env.JUPITER_API_KEY,
  jupiterKeyPreview: process.env.JUPITER_API_KEY ? `${process.env.JUPITER_API_KEY.slice(0, 8)}...` : 'NOT LOADED'
})

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(express.json({limit: '50mb'}))

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/chat', chatRouter)
app.use('/images', imagesRouter)
app.use('/api/jupiter', jupiterSwapRouter)
app.use('/api/sends', sendRouter)

app.listen(3050, () => {
  console.log('Server started on port 3050')
})
