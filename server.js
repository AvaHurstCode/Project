import express from "express"
import csrf from "csurf"
import cookieParser from "cookie-parser"
import bodyParser from "body-parser"
import admin from "firebase-admin"
import mongoose from "mongoose"
import { User } from "./User"
import { Project } from "./Project"

const mongoDB = "mongodb://localhost:27017/Project"

mongoose.connect(mongoDB)

const serviceAccount = require("./serviceAccountKey.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const csrfMiddleware = csrf({ cookie: true })

const PORT = process.env.PORT || 3000
const app = express()

app.set("view engine", "ejs")

app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }))

app.use(bodyParser.json())
app.use(cookieParser())
app.use(csrfMiddleware)

app.all("*", (req, res, next) => {
    res.cookie("CSRF-TOKEN", req.csrfToken())
    next()
})

app.get(["/", "/index"], (req, res) => {
    res.render('index')
})

app.get("/portfolio", (req, res) => {
    res.render('portfolio')
})

app.get("/signup", (req, res) => {
    res.render('sign-up')
})

app.get("/login", (req, res) => {
    res.render('login')
})

app.get("/profile", (req, res) => {
    const sessionCookie = req.cookies.session || ""

    admin
        .auth()
        .verifySessionCookie(sessionCookie, true)
        .then((user) => {
            res.render("profile", {user: user})
        })
        .catch((error) => {
            res.redirect("/login");
        })
})

app.get("/editor", (req, res) => {
    const sessionCookie = req.cookies.session || ""

    admin
        .auth()
        .verifySessionCookie(sessionCookie, true)
        .then((user) => {
            res.render("newProject", {user: user})
        })
        .catch((error) => {
            res.redirect("/login");
        })
})

app.get("/editor/:projectId", (req, res) => {
    const sessionCookie = req.cookies.session || ""

    admin
        .auth()
        .verifySessionCookie(sessionCookie, true)
        .then((user) => {
            console.log(user)
            User
                .findOne({firebase_id: user.uid})
                .then((mongoUser) => {
                    console.log(mongoUser)
                    Project
                        .findOne(req.params.id)
                        .then((project) => {
                            console.log(project)
                            if(project.userId === mongoUser.id) {
                                res.render("project", {projectData: project})
                            }
                        })
                        .catch((error) => {
                            console.log(error)
                        })
                })
                .catch((error) => {
                    console.log(error);
                })
        })
        .catch((error) => {
            res.redirect("/login");
        })
})


app.post("/sessionLogin", (req, res) => {
    const idToken = req.body.idToken.toString()
    const firebase_user = req.body.user

    const expiresIn = 60 * 60 * 24 * 5 * 1000

    admin
        .auth()
        .createSessionCookie(idToken, { expiresIn })
        .then((sessionCookie) => {
            const options = { maxAge: expiresIn, httpOnly: true }
            res.cookie("session", sessionCookie, options)
            res.end(JSON.stringify({ status: "success" }))
            
            let query = { firebase_id: firebase_user.uid.toString() },
                update = {
                    firebase_id: firebase_user.uid.toString(),
                    email: firebase_user.email.toString()
                },
                mongoOptions = {
                    upsert: true
                }
            
            User.findOneAndUpdate(query, update, mongoOptions)
                .then((result) => {
                    if(!result) {
                        result = new User({
                            firebase_id: firebase_user.uid.toString(),
                            email: firebase_user.email.toString()
                        })
                    }
                    result.save()
                })
            },
            (error) => {
                res.status(401).send("UNAUTHORIZED REQUEST!\n" + error)
            }
        )

})

app.get("/sessionLogout", (req, res) => {
    res.clearCookie("session")
    res.redirect("/login")
})

app.post("/newProject", (req, res) => {
    console.log("creating new project")
    const sessionCookie = req.cookies.session || ""

    admin
        .auth()
        .verifySessionCookie(sessionCookie, true)
        .then((user) => {
            console.log("finding user in database")
            User
                .findOne({firebase_id: user.uid})
                .then((mongoUser) => {
                    console.log("creating new project for user" + mongoUser)
                    project = new Project({
                        userId: mongoUser.id,
                        title: req.body.title,
                        description: req.body.description,
                        public: req.body.public
                    })
                    project.save()
                })
                .catch((error) => {
                    console.log(error)
                })
        })
        .catch((error) => {
            res.redirect("/login");
        })
})

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})