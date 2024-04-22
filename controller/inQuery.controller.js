import InQuery from "../model/inQuery.modal.js";

export const postInQuery = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    await InQuery.create({
      name,
      email,
      message,
    });
    res.status(200).json({ message: "we received your in query" });
  } catch (error) {
    console.log("Error: " + error);
    res.status(500).json({ message: "Internal server error" });
  }
};
