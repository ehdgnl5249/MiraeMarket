const express = require('express');
const router = express.Router();
const { BestSeller } = require('../models/BestSeller');

// 베스트셀러 데이터 전체 조회
router.get('/', (req, res) => {
	BestSeller.find({})
		.exec((err, bestseller) => {
			if (err) res.status(400).send(err);
			return res.status(200).json({ success: true, bestseller});
		});
});

module.exports = router;