const router = require("express").Router();
const { predictRestock, chat } = require("../controllers/aiController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

// GET /api/ai/predict-restock?days=30
router.get("/predict-restock", authorize("admin", "manager"), predictRestock);

// POST /api/ai/chat  — customer chatbot (all authenticated users)
router.post("/chat", chat);

module.exports = router;
