import express from 'express'
import multer from 'multer'
import { geminiImage } from './gemini'

const upload = multer()
const router = express.Router()

router.post('/gemini', upload.single('file') as any, geminiImage)

export default router
