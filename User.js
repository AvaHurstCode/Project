import mongoose from "mongoose"

const usersSchema = new mongoose.Schema({
    firebase_id: String,
    email: String,
})

export let User = mongoose.model("User", usersSchema)