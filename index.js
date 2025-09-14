const express = require("express")
const cors = require("cors")
const nodemailer = require("nodemailer");
const mongoose = require("mongoose")
const app = express()
app.use(cors())
app.use(express.json()) //middelware

mongoose.connect("mongodb+srv://shameemreshma:12345@cluster0.txyblbt.mongodb.net/passkey?retryWrites=true&w=majority&appName=Cluster0").then(function(){
  console.log("Connected to db")
}).catch(function(){
  console.log("Failed")
})







const emailSchema= new mongoose.Schema({
  subject: { type: String, required: true },
  msg: { type: String, required: true },
  emailList: { type: [String], required: true },
  status: { type: String, enum: ["Success", "Fail"], default: "Success" },
  date: { type: Date, default: Date.now }
})

//creating model in the name of credential
const credential = mongoose.model("credential", emailSchema, "bulkmail");

app.post("/sendemail", async function(req, res){
  const { msg, emailList, subject } = req.body

  credential.find().then(function(data){
    console.log(data[0].toJSON()) //converting into json

    
    const transporter = nodemailer.createTransport({
      service:"gmail",
      auth: {
        user:data[0].toJSON().user,
        pass:data[0].toJSON().pass,
      },
    });

    new Promise( async function(resolve,reject){
      try{
        for(i=0;i<emailList.length;i++){
          await transporter.sendMail({
            from:"reshmashameen36@gmail.com",
            to:emailList[i],
            subject:subject,
            text:msg
          })
          console.log("Email sent to:"+emailList[i])
        }
        resolve("Success")
      } 
      catch(error){
        console.log("Error")
        reject("Fail")
      } 
    }).then(async function(){
      // This helps to save the email after sending successfully
      const newEmail = new credential({
        subject,
        msg,
        emailList,
        status: "Success",
      });
      await newEmail.save();

      res.send(true)
    }).catch(async function(){
      // This helps to save the email even it is failed
      const failedEmail = new credential({
        subject,
        msg,
        emailList,
        status: "Fail",
      });
      await failedEmail.save();

      res.send(false)
    })
    
  }).catch(function(error){
    console.log(error)
  })
})

app.get("/emails", async function(req, res) {
  try {
    
    const emails = await credential.find({ user: { $exists: false } });
    res.json(emails);
  } catch (err) {
    console.error(err);
    res.send("Error fetching history");
  }
});
app.listen(3000,function(){
  console.log("Server Started...")
})

