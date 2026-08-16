import express from 'express';
import dotenv from 'dotenv';

dotenv.config({
    path: './.env'
});
import connectDB from './database/index.js';
import  "./cron/deleteUser.cron.js"
import dns from 'dns';
dns.setServers(["1.1.1.1", "8.8.8.8"]);


import {app} from './app.js'

//Database connection
connectDB()
.then(() =>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    })
    app.on('error',(error)=>{
        console.log("Error in server connection !!!", error);
    })
})
.catch((error)=>{
    console.log("MONGOBD connection failed !!!", error);
});
