import express from 'express'
import cors from 'cors'
import { scheduleAtMidnight } from './controllers/user.controller.js'
import cron from 'node-cron'


const app = express()
const port = process.env.PORT || 3000
app.use(cors())
app.use(express.json())

cron.schedule('*/30 * * * * *', scheduleAtMidnight);
  


app.get('/', (req, res) => {res.send('Connect')})
    
import UserRouter from "./routes/user.routes.js"
import AvatarRouter from "./routes/avatar.routes.js"

app.use('/user', UserRouter);


app.use('/avatar', AvatarRouter);


app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})
