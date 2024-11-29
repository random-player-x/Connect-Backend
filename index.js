import express from 'express'
import cors from 'cors'
import { scheduleAtMidnight } from './controllers/user.controller.js'
import cron from 'node-cron'


const app = express()

app.use(cors())
app.use(express.json())

cron.schedule('*/30 * * * * *', scheduleAtMidnight);
  


app.get('/', (req, res) => {res.send('Connect')})
    

import UserRouter from "./routes/user.routes.js"
app.use('/user', UserRouter);

    
const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})
