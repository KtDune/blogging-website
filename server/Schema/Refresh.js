import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema({
    token: String,
    userId: mongoose.Schema.Types.ObjectId,
    expiresAt: Number,
})

export default mongoose.model("refreshTokens", RefreshTokenSchema)
