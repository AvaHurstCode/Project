import express from "express"
import csrf from "csurf"
import cookieParser from "cookie-parser"
import bodyParser from "body-parser"
import admin from "firebase-admin"
import mongoose from "mongoose"
import { User } from "./User.js"
import { Project } from "./Project.js"
import { sanitize } from './sanitizer.js';
import markdownlint from "markdownlint"
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config()

const serviceAccountJson = fs.readFileSync('./serviceAccountKey.json', 'utf8');
const serviceAccount = JSON.parse(serviceAccountJson);



const mongoDB = `mongodb+srv://avahurst:${process.env.DB_PASSWORD}@avahurst.xo18im9.mongodb.net/Project?retryWrites=true&w=majority&appName=AvaHurst`

try {
    await mongoose.connect(mongoDB)
    console.log("db conntected")
} catch (error) {
    console.log(error)
}

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

app.use((req, res, next) => {
    Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
            req.body[key] = sanitize(req.body[key]);
        }
    });
    next();
});

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
            res.render("profile", { user: user })
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
            res.render("newProject", { user: user })
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
            User
                .findOne({ firebase_id: user.uid })
                .then((mongoUser) => {
                    Project
                        .findOne({ _id: req.params.projectId })
                        .then((project) => {
                            if(project) {
                                if(project.userId.toString() == mongoUser.id) {
                                    res.render("editor", {projectData: project})
                                } else {
                                    res.send("Unknown project")
                                }
                            } else {
                                res.send("Unknown project")
                            }
                        })
                        .catch((error) => {
                            console.error(error)
                        })
                })
                .catch((error) => {
                    console.error(error);
                })
        })
        .catch((error) => {
            res.redirect("/login");
        })
})

app.get("/viewer/:projectId", (req, res) => {
    const sessionCookie = req.cookies.session || ""

    admin
        .auth()
        .verifySessionCookie(sessionCookie, true)
        .then((user) => {
            User
                .findOne({ firebase_id: user.uid })
                .then((mongoUser) => {
                    Project
                        .findOne({ _id: req.params.projectId })
                        .then((project) => {
                            if(project.public == false) {
                                if(project.userId.toString() == mongoUser.id) {
                                    res.render("project", { projectData: project, owner: true})
                                } else {
                                res.send("Unknown Project")
                                }
                            } else {
                                if(project.userId.toString() == mongoUser.id) {
                                    res.render("project", { projectData: project, owner: true })
                                } else {
                                    res.render("project", { projectData: project, owner: false })
                                }
                            }
                        })
                        .catch((error) => {
                            console.error(error)
                        })
                })
                .catch((error) => {
                    console.error(error);
                })
        })
        .catch((error) => {
            res.redirect("/login");
        })
})

app.get("/browse", (req, res) => {

    Project.find({ public: true })
        .then((projects) => {
            res.render("browse", { projects: projects })
        })
})

app.get("/browse/self", (req, res) => {
    const sessionCookie = req.cookies.session || ""

    admin
        .auth()
        .verifySessionCookie(sessionCookie, true)
        .then((user) => {
            User
                .findOne({ firebase_id: user.uid })
                .then((mongoUser) => {
                    Project.find({ userId: mongoUser.id})
                        .then((projects) => {
                            res.render("browseOwn", { projects: projects })
                        })
                })
                .catch((error) => {
                    console.error(error)
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
    const sessionCookie = req.cookies.session || ""
    const markdownContent = req.body.markdownContent || "";
    const lintResults = markdownlint.sync({
        strings: { markdownContent },
        config: { "default": true }
    });

    if (lintResults.length > 0) {
        return res.status(400).json({ message: "Markdown content validation failed", errors: lintResults });
    }

    admin
        .auth()
        .verifySessionCookie(sessionCookie, true)
        .then((user) => {
            User
                .findOne({ firebase_id: user.uid })
                .then((mongoUser) => {
                    let project = new Project({
                        userId: mongoUser.id,
                        title: req.body.projectTitle,
                        description: req.body.projectDescription,
                        markdownContent: req.body.markdownContent,
                        public: req.body.public
                    })
                    project.save()
                        .then((savedProject) => {
                            res.redirect("/editor/"+savedProject.id)
                        })
                })
                .catch((error) => {
                    console.error(error)
                })
        })
        .catch((error) => {
            res.redirect("/login");
        })
})

app.post("/updateProject/:projectId", (req, res) => {
    const sessionCookie = req.cookies.session || ""
    const markdownContent = req.body.markdownContent || "";
    const lintResults = markdownlint.sync({
        strings: { markdownContent },
        config: { "default": true }
    });

    if (lintResults.length > 0) {
        return res.status(400).json({ message: "Markdown content validation failed", errors: lintResults });
    }

    admin
        .auth()
        .verifySessionCookie(sessionCookie, true)
        .then((user) => {
            Project
                .findOneAndUpdate(new mongoose.Types.ObjectId(req.params.projectId),
                    {
                        title: req.body.projectTitle,
                        description: req.body.projectDescription,
                        markdownContent: req.body.markdownContent,
                        public: req.body.public
                    })
                .catch((error) => {
                    console.error(error)
                })
        })
        .catch((error) => {
            console.error(error)
            res.redirect("/login");
        })
})

app.delete("/deleteProject/:projectId", (req, res) => {
    const sessionCookie = req.cookies.session || ""

    admin
        .auth()
        .verifySessionCookie(sessionCookie, true)
        .then((user) => {
            Project
                .findOneAndDelete(new mongoose.Types.ObjectId(req.params.projectId))
                .then(() => {
                    res.redirect("/")
                })
                .catch((error) => {
                    console.error(error)
                })
        })
        .catch((error) => {
            console.error(error)
            res.redirect("/login");
        })
})

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})