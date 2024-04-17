import mongoose from "mongoose"

const mongoDB = ``
try {
    console.log("test")
    await mongoose.connect("mongodb+srv://avahurst:temp0raryWi11Rep1aceAfterHand-1n@avahurst.xo18im9.mongodb.net/Project?retryWrites=true&w=majority&appName=AvaHurst")
    console.log("test")
} catch (error) {
    console.log(error)
}