import mongoose from "mongoose"

const projectSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    title: String,
    description: String,
    markdownContent: String,
    public: Boolean,
})

export let Project = mongoose.model("Project", projectSchema)