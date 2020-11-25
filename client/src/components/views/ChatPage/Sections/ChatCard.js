import React from 'react';
import { Comment, Avatar } from 'antd';
import { useSelector } from 'react-redux';
import './ChatCard.css';
function ChatCard(props) {
	const user = useSelector((state) => state.user);

	if (props.chat.sender._id === user.userData._id) {
		return (
			<div
				key={props.chat._id}
				style={{
					display: 'flex',
					width: '95%',
					justifyContent: 'flex-end',
					marginBottom: '1rem',
				}}
			>
				<span className="box">{props.chat.message}</span>
			</div>
		);
	} else {
		return (
			<div key={props.chat._id} style={{ display: 'flex', width: '100%' }}>
				<Comment
					author={
						props.chat.sender && (
							<p style={{ color: 'white' }}>{props.chat.sender.name}</p>
						)
					}
					avatar={
						<Avatar
							src={props.chat.sender && props.chat.sender.image}
							alt={props.chat.sender && props.chat.sender.name}
						/>
					}
					content={
						<div style={{ height: '30px' }}>
							<span className="box" style={{ width: '200px' }}>
								{props.chat.message}
							</span>
						</div>
					}

				/>
			</div>
		);
	}
}

export default ChatCard;
