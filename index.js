// import * as dotenv from 'dotenv'rs
// dotenv.config()

import express from 'express'
const app = express()



import cors from 'cors'
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {res.send('Connect')})
    

    
const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})
