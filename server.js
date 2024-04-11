import express from "express"
import csrf from "csurf"
import cookieParser from "cookie-parser"
import bodyParser from "body-parser"
import admin from "firebase-admin"

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
        .verifySessionCookie(sessionCookie, true /* checkRevoked */)
        .then(() => {
            res.render("profile")
        })
        .catch((error) => {
            res.redirect("/login");
        })
})

app.post("/sessionLogin", (req, res) => {
    const idToken = req.body.idToken.toString()

    const expiresIn = 60 * 60 * 24 * 5 * 1000

    admin
        .auth()
        .createSessionCookie(idToken, { expiresIn })
        .then(
            (sessionCookie) => {
                const options = { maxAge: expiresIn, httpOnly: true }
                res.cookie("session", sessionCookie, options)
                res.end(JSON.stringify({ status: "success" }))
            },
            (error) => {
                res.status(401).send("UNAUTHORIZED REQUEST!")
            }
        )
})

app.get("/sessionLogout", (req, res) => {
    res.clearCookie("session")
    res.redirect("/login")
})

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})