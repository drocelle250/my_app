const router = require("express").Router();
const { placeOrder, myOrders, allOrders, updateStatus } = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.post("/",              placeOrder);
router.get("/my",             myOrders);
router.get("/",               authorize("admin", "manager"), allOrders);
router.put("/:id/status",     authorize("admin", "manager"), updateStatus);

module.exports = router;
