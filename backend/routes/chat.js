const express = require("express");
const controller = require("../controllers/chatController");
const { chatRateLimit } = require("../middleware/chatRateLimit");

const router = express.Router();

router.post("/", chatRateLimit, controller.ask);

module.exports = router;
