import mongoose from "mongoose";

const inQuerySchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
});
const InQuery = mongoose.model("InQuery", inQuerySchema);

export default InQuery;
