create table users (
	id serial primary key, 
	username varchar(150) not null unique,
	user_type varchar(10) not null check (user_type in ('user', 'admin')),
	email varchar(255),
	avatar text,
	last_seen_at timestamp, --dung thay cho isonline
	created_at timestamp default current_timestamp,
	updated_at timestamp default current_timestamp
);

CREATE TABLE chat_rooms (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
	-- last_seen_message_id integer references messages(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id) --1 user chỉ có 1 room với admin , 
	alter table chat_rooms add column last_seen_message_id integer references messages(id)
);


create table messages (
	id serial primary key, 
	room_id integer references chat_rooms(id) on delete cascade,
	sender_id integer references users(id),
	content text not null,
	created_at timestamp default current_timestamp
)



