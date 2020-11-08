require("dotenv").config();

import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";

const bodyParser = require("body-parser");
const mongoose = require("mongoose");


let indexRouter = require("./routes/index");
let usersRouter = require("./routes/users");
let moviesRouter = require("./routes/movies");

let app = express();
app.use(bodyParser.urlencoded({ extended: true, }));
app.use(bodyParser.json());

// Node.js의 native Promise 사용
mongoose.Promise = global.Promise;

// CONNECT TO MONGODB SERVER
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, })
  .then(() => console.log("Successfully connected to mongodb"))
  .catch((e: any) => console.error(e));


// Define Schemes
const todoSchema = new mongoose.Schema({
  todoid: { type: Number, required: true, unique: true, },
  content: { type: String, required: true, },
  completed: { type: String, default: false, },
},
{
  timestamps: true,
});

// Create Model & Export
module.exports = mongoose.model("Todo", todoSchema);





// view engine setup
app.set("public", path.join(__dirname, "public"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api/movies", moviesRouter);

// catch 404 and forward to error handler
app.use((req: any, res: any, next: any) => {
  next(createError(404));
});

// error handler
app.use((err: any, req: any, res: any, next: any) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
