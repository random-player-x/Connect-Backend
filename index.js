// import * as dotenv from 'dotenv'rs
// dotenv.config()
import express from 'express'
const app = express()

import avatarRoutes from './routes/avatar.routes'

import cors from 'cors'
app.use(cors())
app.use(express.json())
const port = process.env.PORT || 3000

app.use('/api/avatar', avatarRoutes)

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})
