const express=require('express');
const app=express();
const mongodb=require('mongodb');
const MongoClient=mongodb.MongoClient;
const cors=require('cors');
const db_URL="mongodb://localhost:27017"
const nodemailer=require('nodemailer')
const dotenv=require('dotenv')
const crypto=require('crypto');
dotenv.config()
//config
app.use(express.json());
app.use(cors());
app.set('view engine','ejs');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USER_NAME,
        pass: process.env.PASSWORD
    }
    });
app.post("/check", async (req,res)=>{
    const client=await MongoClient.connect(db_URL, { useNewUrlParser: true, useUnifiedTopology: true});;
    try {
        const db=client.db("password_reset");
        const check=await db.collection("users").findOne({userid:req.body.email});
        if(check){
            //To Add mail options
            const randomString=crypto.randomBytes(18).toString('hex')
            const update=await db.collection("users").updateOne({userid:req.body.email},{$set:{"verify":randomString}});
            const message = {
                from: 'ananeee1818@gmail.com',
                to: check.userid,
                subject: 'Forgot Password',
                html: `<div><p>Verification Code:${randomString}</p><a href="http://localhost:4040/reset">Link for Resetting the Password</a></div>`
            };
            transporter.sendMail(message,function(err,info){
                if(err){
                    console.log("Couldnt send message",err)
                }else{
                    console.log("EMAIL SENT!")
                }
            })
            res.status(200).send("Instructions to Reset Email have been sent to your Email ID");
        }else{
            res.status(404).send("Email not found,Enter the correct email address");
        }
    } catch (error) {
        res.status(500).send("Error,pls try again");
    }finally{
        client.close();
    }
})

//validate random string generated
app.post("/validate",async (req,res)=>{
    console.log("Reaching")
    const client=await MongoClient.connect(db_URL, { useNewUrlParser: true, useUnifiedTopology: true});
    console.log(req.body)
    try {
        const db=client.db("password_reset");
        const check=await db.collection("users").findOne({verify:req.body.verification_code});
        if(check){
            res.status(200).json({"message":"Please Update your password now"})
        }else{
            console.log("ERROR")
            res.status(404).json({"message":"Cant fetch"})
        }
    }catch(err){
        console.log(err)
        res.status(500).json({"message":"Server Error"})
    }
})
app.get("/reset",(req,res)=>{
    res.render('resetpage')
})
app.post("/changepassword",async (req,res)=>{
    const client=await MongoClient.connect(db_URL, { useNewUrlParser: true, useUnifiedTopology: true});
    console.log(req.body)
    try {
        const db=client.db("password_reset");
        const check=await db.collection("users").findOne({verify:req.body.ver});
        if(check){
            const change=await db.collection("users").updateOne({verify:req.body.ver},{$set:{password:req.body.new_pass,verify:"None"}});
            res.status(200).json({"message":"Password changed Successfully!"})
        }
        else{
            res.status(403).json({"message":"Couldn't change Password,Pls try again"})
        }
    }catch(err){
        console.log(err)
        res.status(403).json({"message":"Couldn't change Password,Pls try again"})
    }finally{
        client.close()
    }
})
app.post("/register",async (req,res)=>{
    const client=await MongoClient.connect(db_URL, { useNewUrlParser: true, useUnifiedTopology: true});
    try {
        const db=client.db("password_reset");
        const addUser=await db.collection("users").insertOne({userid:req.body.userid,password:req.body.password,verify:""})
        res.status(200).send("Created!Now use Forgot Password Option")
    }catch(err){
        res.status(500).send("Couldnt create,try again")
    }finally{
        client.close()
    }
})
app.listen(process.env.port ||4040,()=>{
    console.log("Server Listening");
})