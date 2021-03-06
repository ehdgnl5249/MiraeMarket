import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductImage from './Sections/ProductImage';
import ProductInfo from './Sections/ProductInfo';
import CommentList from './Sections/CommentList';
import CommentWrite from './Sections/CommentWrite';
import { Row, Col, Button, Modal, notification, Popconfirm, message } from 'antd';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

function DetailProductPage(props) {
	const productId = props.match.params.productId;
	const [Product, setProduct] = useState({});
	const [Comments, setComments] = useState([]);
	const user = useSelector((state) => state.user);
	const [visible, setVisible] = useState(false);
	const history = useHistory();

	const openNotificationWithIcon = (type) => {
		notification[type]({
			message: '삭제 완료',
			description: '게시물이 삭제되었습니다.',
			duration: 2,
		});
	};

	// 해당 게시물 정보 조회
	useEffect(() => {
		axios
			.get(`/api/product/products?id=${productId}`)
			.then((response) => {
				setProduct(response.data);
			})
			.catch((err) => history.push('/'));

		getComments();
	}, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

	// 해당 게시물의 댓글 조회
	const getComments = () => {
		axios
			.get(`/api/comment/products?id=${productId}`)
			.then((response) => {
				setComments(response.data);
			})
			.catch((err) => alert(err));
	};

	const showModal = () => {
		setVisible(true);
	};

	// 게시물 삭제 버튼 확인시, 해당 게시물 id로 삭제
	const handleOk = () => {
		axios
			.delete(`/api/product/products?id=${productId}`)
			.then((response) => {
				if (response.data.success) openNotificationWithIcon('success');
			})
			.catch((err) => alert(err));

		setVisible(false);
		return history.push('/');
	};

	// 삭제 취소
	const handleCancel = () => {
		setVisible(false);
	};

	// 게시물 수정하기 눌렀을 시
	const confirm = () => {
		message.success('수정 페이지로');
		return history.push({
			pathname: `/product/${productId}/edit`,
			state: `/product/${productId}`,
		});
	};

	const cancel = () => {
		message.error('수정 취소');
	};

	// 댓글 목록 확인
	const commentListAdd = () => {
		getComments();
	};

	return (
		<div style={{ width: '100%', padding: '3rem 4rem' }}>
			<div style={{ display: 'flex', justifyContent: 'center' }}>
				<h1>{Product.title}</h1>
			</div>
			<div style={{ float: 'right' }}>
				{/* 해당 글쓴이와 유저가 같다면 수정, 삭제 버튼 보이게 */}
				{Product.writer &&
				user.userData._id &&
				Product.writer._id === user.userData._id ? (
					<>
						<Popconfirm
							title="게시물을 수정하시겠습니까?"
							onConfirm={confirm}
							onCancel={cancel}
							okText="Ok"
							cancelText="No"
						>
							<Button>수정</Button>
						</Popconfirm>
						<Button onClick={showModal} type="danger">
							삭제
						</Button>
						,
						<Modal
							title="게시물 삭제"
							visible={visible}
							onOk={handleOk}
							onCancel={handleCancel}
							okText={'삭제'}
							cancelText={'취소'}
							okType="danger"
						>
							<p>이 게시물을 삭제하시겠습니까?</p>
						</Modal>
					</>
				) : (
					''
				)}
			</div>
			<br />

			<Row gutter={[16, 16]}>
				<Col lg={24} sm={24}>
					<ProductImage detail={Product} />
				</Col>

				<ProductInfo detail={Product} />

				<Col lg={24} sm={24}>
					<CommentList commentList={Comments} refresh={commentListAdd} />
				</Col>
				<Col lg={24} sm={24}>
					<CommentWrite detail={Product} refresh={commentListAdd} />
				</Col>
			</Row>
		</div>
	);
}

export default DetailProductPage;
