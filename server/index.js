import express from "express";
import userRoute from './routes/user.route.js'
const app = express();

app.use('/user',userRoute);

app.listen(3000, ()=>{
    console.log("Server is running on port 3000")
})