const router = require("express").Router();
const Student = require("../model/student");

// GET all students
router.get("/", async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADD new student
router.post("/add", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const newStudent = new Student({
      name,
      email,
      password
    });

    const savedStudent = await newStudent.save();
    res.status(201).json(savedStudent);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE student
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    const student = await Student.findByIdAndUpdate(
      id,
      { name, email, password },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);

  } catch (error) {
    console.error("Update error:", error.message);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;