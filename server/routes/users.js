const express = require('express');
const router = express.Router();
const multer = require('multer');
const { User } = require('../models/User');
const passport = require('passport');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Product } = require('../models/Product');

// 유저 인증 API
// 해당 유저가 로그인 되어있는지 미들웨어로 확인 후
// 로그인 되어 있다면
// 유저의 id, 로그인여부, 이메일, 이름, 권한, 이미지, 전공, 거래목록, 전화번호 리턴
router.get('/auth', isLoggedIn, (req, res) => {
	// console.log("auth: ",req.user)
	res.status(200).json({
		_id: req.user._id,
		isAdmin: req.user.role === 0 ? false : true,
		isAuth: true,
		email: req.user.email,
		name: req.user.name,
		role: req.user.role,
		image: req.user.image,
		major: req.user.major,
		cart: req.user.cart,
		phone: req.user.phone,
	});
});

// 로그아웃 API
// 로그아웃 후 세션, 접속 쿠키까지 삭제시킴
router.get('/logout', isLoggedIn, (req, res) => {
	req.logout();
	req.session.destroy();
	return res.clearCookie('connect.sid', { path: '/' }).status(200).send({
		success: true,
	});

});

// Email 중복 체크 (회원가입시)
// 로그인이 되어있지 않을 때만 
router.get('/', isNotLoggedIn, (req, res) => {

	User.findOne({ email: req.query.email }, (err, userInfo) => {
		if (err) {
			return res.status(500).json({ success: false, err })
		}
		if (userInfo === null) {
			return res.status(200).json({ success: true })	
		} else {
			return res.status(200).json({
				success: false,
			});
		}
	})
});

// npmjs.com/package/multer
var storage = multer.diskStorage({
	// 저장 위치
	destination: function (req, file, cb) {
		cb(null, 'uploads/avatar/');
	},
	// 파일 명
	filename: function (req, file, cb) {
		cb(null, `${Date.now()}_${file.originalname}`);
	},
});
var upload = multer({ storage: storage }).single('file');

// 프로필 저장 API
router.post('/profileImage', (req, res) => {
	upload(req, res, (err) => {
		if (err) {
			return res.json({ success: false, err });
		}
		return res.json({
			success: true,
			filePath: res.req.file.path,
			fileName: res.req.file.filename,
		});
	});
});

// 회원가입 API
router.post('/register', isNotLoggedIn, (req, res) => {
	const user = new User(req.body);

	user.save((err, doc) => {
		if (err) return res.json({ success: false, err });
		return res.status(200).json({
			success: true,
		});
	});
});

// 로그인 API
// passportJS localLogin을 이용
// 유저가 있다면 로그인 시킨 후, success메시지와 로컬스토리지에 저장할 userId 리턴
router.post('/login', isNotLoggedIn, function (req, res, next) {
	passport.authenticate('local', function (err, user, info) {
		if (err) {
			return next(err);
		}

		if (user) {
			req.login(user, function (err) {
				if (err) {
					return next(err);
				}
				return res.send({ loginSuccess: true, userId: user._id });
			});
		}
	})(req, res, next);
});


// 회원 정보 수정 API
// 해당 유저의 id로 유저를 찾은 후 $set으로 정보 수정
router.put('/edit', isLoggedIn, (req, res) => {
	User.findOneAndUpdate({ _id: req.user._id }, { $set: req.body })
		.exec((err, result) => {
			if (err) res.status(500).send({ success: false, err });
			return res.status(200).send({ success: true });
		})
})

// 각각 카카오, 페이스북, 네이버 소셜로그인 
// passportJS 모듈 및 콜백 URL 주소
router.get('/kakao', passport.authenticate('kakao'));
router.get('/facebook', passport.authenticate('facebook'));
router.get('/naver', passport.authenticate('naver'));

router.get('/kakao/callback', function (req, res, next) {
	passport.authenticate('kakao', {
		successRedirect: 'http://localhost:3000/login',
		failureRedirect: 'http://localhost:3000/login',
		// successRedirect: 'https://mirae-market.herokuapp.com',
		// failureRedirect: 'https://mirae-market.herokuapp.com/login',
	})(req, res, next);
});

router.get('/facebook/callback', function (req, res, next) {
	passport.authenticate('facebook', {
		successRedirect: 'http://localhost:3000/login',
		failureRedirect: 'http://localhost:3000/login',
		// successRedirect: 'https://mirae-market.herokuapp.com',
		// failureRedirect: 'https://mirae-market.herokuapp.com/login',
	})(req, res, next);
});

router.get('/naver/callback', function (req, res, next) {
	passport.authenticate('naver', {
		successRedirect: 'http://localhost:3000/login',
		failureRedirect: 'http://localhost:3000/login',
		// successRedirect: 'https://mirae-market.herokuapp.com',
		// failureRedirect: 'https://mirae-market.herokuapp.com/login',
	})(req, res, next);
});

// 소셜로그인시 redirect로 돌아왔을 때 로그인이 되었는지 확인하기 위함
router.get('/login/success', (req, res) => {
	if (req.user) {
		res.json({
			loginSuccess: true,
			user: req.user,
		});
	} else {
		res.status(403).json({
			message: 'User Not Authenticated',
			loginSuccess: false,
		});
	}
});

// 거래목록 상품 추가 API
router.post('/addToCart', isLoggedIn, (req, res) => {
	// 해당 유저 정보 가져오기
	User.findOne({ _id: req.user._id }, (err, userInfo) => {
		// 기존 유저의 거래목록에 있는 중복되는 상품인지 확인해봄
		let duplicate = false;
		userInfo.cart.forEach((item) => {
			if (item.id === req.body.bookId) {
				duplicate = true;
			}
		});

		if (duplicate) {
			// 중복이면 기존 카트 그대로 반환
			return res.status(200).send(userInfo.cart);
		} else {
			// 판매완료로 변경
			Product.findOne({ _id: req.body.bookId }, (err, product) => {
				product.sold = true;
				product.save();
			});

			// 신규 상품이면
			// 해당 유저를 찾고 해당 유저의 cart에 값을 추가한다.
			// cart 필드는 Array Type이기때문에 $push를 통해서 상품id를 추가
			// update된 후의 정보를 리턴받기 위해서는 {new : true}까지 넘겨줘야 함.

			User.findOneAndUpdate(
				{ _id: req.user._id },
				{
					$push: {
						cart: { id: req.body.bookId },
					},
				},
				{ new: true }, // Update된 정보를 받음
				(err, userInfo) => {
					if (err) return res.status(400).json({ success: false, err });
					return res.status(200).send(userInfo.cart);
				},
			);
		}
	});
});

// 거래목록 상품 삭제 API
// 해당 유저 찾은 후 유저 collection의 카트 Array에서 $pull로 해당 상품 삭제함.
// 삭제하고 난 뒤, redux store의 cart 데이터를 업데이트 시켜주기 위해서
// 상품 collection에서 현재 남아있는 상품 정보로 가져옴
router.get('/removeFromCart', isLoggedIn, (req, res) => {
	// 판매중으로 다시 변경
	Product.findOne({ _id: req.query.id }, (err, product) => {
		product.sold = false;
		product.save();
	});

	User.findOneAndUpdate(
		{ _id: req.user._id },
		{
			$pull: { cart: { id: req.query.id } },
		},
		{ new: true },
		(err, userInfo) => {
			// 현재 유저의 거래목록 상품 array로 전처리해줌
			let cart = userInfo.cart;
			let array = cart.map((item) => {
				return item.id;
			});

			// product collection에서 현재 남아있는 상품 정보 가져오기
			Product.find({ _id: { $in: array } })
				.populate('writer')
				.exec((err, productInfo) => {
					return res.status(200).json({
						productInfo,
						cart,
					});
				});
		},
	);
});

// 타 유저 프로필 정보 확인용 API
// 해당 유저 id를 통해 그 유저의 정보를 리턴받음
router.get('/userInfo', (req, res) => {
	User.findOne({ _id: req.query.id})
		.exec((err, user) => {
			if(err) return res.send({ success: false, err })
			return res.send({ success: true, user })
		})
})

module.exports = router;
