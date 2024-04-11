import express from "express"

const app = express()

app.set("view engine", "ejs")

app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }))

app.listen(3030, () => {
    console.log("Listening on port 3030")
})

app.get(["/", "/index"], (req, res) => {
    res.render('index')
})

app.get("/portfolio", (req, res) => {
    res.render('portfolio')
})