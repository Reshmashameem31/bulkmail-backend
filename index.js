const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json()); // middleware

// Connect to MongoDB Atlas
mongoose
  .connect(
    "mongodb+srv://shameemreshma:12345@cluster0.faz2m0g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch(() => console.log("Failed to connect to MongoDB"));

// Email schema
const emailSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  msg: { type: String, required: true },
  emailList: { type: [String], required: true },
  status: { type: String, enum: ["Success", "Fail"], default: "Success" },
  date: { type: Date, default: Date.now },
});

// Model
const Credential = mongoose.model("Credential", emailSchema, "bulkmail");

// Root route
app.get("/", (req, res) => {
  res.send("BulkMail Backend is running!");
});

// Send email
app.post("/sendemail", async (req, res) => {
  const { msg, emailList, subject } = req.body;

  Credential.find()
    .then((data) => {
      console.log(data[0]?.toJSON());

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: data[0]?.toJSON().user,
          pass: data[0]?.toJSON().pass,
        },
      });

      new Promise(async (resolve, reject) => {
        try {
          for (let i = 0; i < emailList.length; i++) {
            await transporter.sendMail({
              from: "reshmashameen36@gmail.com",
              to: emailList[i],
              subject: subject,
              text: msg,
            });
            console.log("Email sent to:" + emailList[i]);
          }
          resolve("Success");
        } catch (error) {
          console.log("Error sending emails");
          reject("Fail");
        }
      })
        .then(async () => {
          const newEmail = new Credential({
            subject,
            msg,
            emailList,
            status: "Success",
          });
          await newEmail.save();
          res.send(true);
        })
        .catch(async () => {
          const failedEmail = new Credential({
            subject,
            msg,
            emailList,
            status: "Fail",
          });
          await failedEmail.save();
          res.send(false);
        });
    })
    .catch((error) => console.log(error));
});

// Get all emails
app.get("/emails", async (req, res) => {
  try {
    const emails = await Credential.find({ user: { $exists: false } });
    res.json(emails);
  } catch (err) {
    console.error(err);
    res.send("Error fetching history");
  }
});

// Use Render's assigned port or fallback
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}...`);
});
