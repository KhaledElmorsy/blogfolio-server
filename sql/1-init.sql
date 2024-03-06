DROP SCHEMA public cascade;
CREATE SCHEMA public;


-- =============================================================== --
--	                       EXTENSIONS                              --
-- =============================================================== --

/* Trigram matching for partial text searches */
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================== --
--	                   GENERAL PROCEDURES                          --
-- =============================================================== --

/** 
 * Update the 'edited_at' column with the current time when a row 
 * is updated
 */
CREATE FUNCTION updateEditTime() RETURNS TRIGGER AS $$
	BEGIN
		NEW.edited_at := now();
	RETURN NEW;
	END $$ LANGUAGE 'plpgsql';

-- =============================================================== --
--	                          TABLES                               --
-- =============================================================== --	

-- [resource]_uid columns should be exposed to APIs while 
-- [resource]_id should not

-- --------------------------------------------------------------- --
--	                           USERS                               --
-- --------------------------------------------------------------- --

CREATE TYPE role AS ENUM ('user', 'admin');

CREATE TABLE users (
	user_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	user_uid TEXT NOT NULL UNIQUE,
	username TEXT NOT NULL UNIQUE,
	email TEXT NOT NULL UNIQUE,
	password TEXT NOT NULL,
	role role NOT NULL DEFAULT('user'),
	bio TEXT,
	first_name TEXT,
	last_name TEXT,
	photo_small TEXT,
	photo_full TEXT,
	active BOOLEAN DEFAULT FALSE,
	created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX user_uid ON users (user_uid);
CREATE INDEX user_email ON users (email);
CREATE INDEX user_username ON users (username);
CREATE INDEX user_first_name ON users (first_name);
CREATE INDEX user_last_name ON users (last_name);

CREATE TABLE user_follows (
	user_id BIGINT REFERENCES users ON DELETE CASCADE,
	follower_id BIGINT REFERENCES users ON DELETE CASCADE,
	created_at TIMESTAMPTZ DEFAULT now(),
	PRIMARY KEY (user_id, follower_id)
);
CREATE INDEX user_follows_follower_id ON user_follows (follower_id);

-- --------------------------------------------------------------- --
--	                           NODES                               --
-- --------------------------------------------------------------- --


CREATE TABLE nodes (
	node_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	node_parent_id BIGINT REFERENCES nodes ON DELETE CASCADE
);
CREATE INDEX node_parent ON nodes USING HASH (node_parent_id);

CREATE TABLE posts (
	node_id BIGINT UNIQUE REFERENCES nodes ON DELETE CASCADE,
	post_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	post_uid TEXT NOT NULL UNIQUE,
	user_id INT NOT NULL REFERENCES users ON DELETE CASCADE,
	slug TEXT NOT NULL UNIQUE,
	UNIQUE(slug, user_id),
	title TEXT NOT NULL,
	summary TEXT,
	visible BOOLEAN NOT NULL DEFAULT FALSE,
	num_views INT NOT NULL DEFAULT 0,
	body TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	edited_at TIMESTAMPTZ,
	text_search TSVECTOR GENERATED ALWAYS AS (
		setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
		setweight(to_tsvector('english', COALESCE(summary, '')), 'B') ||
		setweight(to_tsvector('english', COALESCE(body, '')), 'C')
		) STORED
);
CREATE INDEX post_author ON posts USING HASH (user_id);
CREATE INDEX post_node ON posts USING HASH (node_id);
CREATE INDEX text_search ON posts USING GIN (text_search);
CREATE INDEX title_trgm_index ON posts USING GIN (title gin_trgm_ops);
CREATE TRIGGER post_edit_time
	BEFORE UPDATE ON posts
	FOR EACH ROW EXECUTE FUNCTION updateEditTime();

	
CREATE TABLE post_user_views (
	post_id BIGINT NOT NULL REFERENCES posts ON DELETE CASCADE,
	user_id BIGINT NOT NULL REFERENCES users ON DELETE CASCADE,
	PRIMARY KEY (post_id, user_id)
);
	
CREATE TABLE comments (
	comment_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	comment_uid TEXT NOT NULL UNIQUE,
	user_id BIGINT REFERENCES users ON DELETE SET NULL,
	post_id BIGINT NOT NULL REFERENCES posts ON DELETE CASCADE,
	parent_comment_id BIGINT REFERENCES comments,
	body TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	edited_at TIMESTAMPTZ
);
CREATE INDEX comment_post ON comments USING HASH (post_id);
CREATE INDEX comment_author ON comments USING HASH (user_id);
CREATE INDEX comment_parent ON comments USING HASH (parent_comment_id);
CREATE OR REPLACE TRIGGER comment_edit_log
	BEFORE UPDATE ON comments
	FOR EACH ROW EXECUTE FUNCTION updateEditTime();

-- --------------------------------------------------------------- --
--	                         EMOTES                                --
-- --------------------------------------------------------------- --

CREATE TABLE emotes (
	emote_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	emote_body TEXT NOT NULL
);

INSERT INTO emotes (emote_body) VALUES ('👍'),('😊'),('😂'),('❤️'),('🤩');

CREATE TABLE comment_emotes (
	comment_id BIGINT NOT NULL REFERENCES comments ON DELETE CASCADE,
	emote_id INT NOT NULL REFERENCES emotes ON DELETE CASCADE,
	user_id BIGINT NOT NULL REFERENCES users ON DELETE CASCADE,
	PRIMARY KEY (comment_id, user_id)
);
CREATE INDEX comment_emote_id ON comment_emotes USING HASH (comment_id);

CREATE TABLE post_emotes (
	post_id BIGINT NOT NULL REFERENCES posts ON DELETE CASCADE,
	emote_id INT NOT NULL REFERENCES emotes ON DELETE CASCADE,
	user_id BIGINT NOT NULL REFERENCES users ON DELETE CASCADE,
	PRIMARY KEY (post_id, user_id)
);
CREATE INDEX post_emote_id ON post_emotes USING HASH (post_id);

-- --------------------------------------------------------------- --
--	                         PROJECTS                              --
-- --------------------------------------------------------------- --

CREATE TABLE projects (
	project_uid TEXT PRIMARY KEY,
	user_id BIGINT REFERENCES users ON DELETE CASCADE,
	name TEXT NOT NULL,
	description TEXT NOT NULL,
	skills TEXT[] NOT NULL,
	priority INT NOT NULL,
	UNIQUE(user_id, priority) DEFERRABLE
);
CREATE INDEX project_user_id ON projects USING HASH (user_id);


-- --------------------------------------------------------------- --
--	                    CATEGORIES & TAGS                          --
-- --------------------------------------------------------------- --
	
CREATE TABLE categories (
	category_id SERIAL PRIMARY KEY,
	category_name TEXT NOT NULL,
	photo_url TEXT,
	user_id BIGINT REFERENCES users ON DELETE SET NULL
);
CREATE INDEX category_creator on categories (user_id);

CREATE TABLE category_junction (
	parent_category_id INT REFERENCES categories ON DELETE CASCADE,
	child_category_id INT REFERENCES categories ON DELETE CASCADE,
	PRIMARY KEY (parent_category_id, child_category_id)
);

CREATE TABLE category_follows (
	category_id INT REFERENCES categories ON DELETE CASCADE,
	user_id BIGINT REFERENCES users ON DELETE CASCADE,
	PRIMARY KEY (category_id, user_id)
);

CREATE TABLE tags (
	tag_id SERIAL PRIMARY KEY,
	tag_name TEXT NOT NULL,
	image_url TEXT
);

CREATE TABLE tag_follows (
	tag_id INT REFERENCES tags ON DELETE CASCADE,
	user_id BIGINT REFERENCES users ON DELETE CASCADE,
	PRIMARY KEY (tag_id, user_id)
);

CREATE TABLE tag_category (
	tag_id INT REFERENCES tags ON DELETE CASCADE,
	category_id INT REFERENCES categories ON DELETE CASCADE,
	PRIMARY KEY (tag_id, category_id)
);


-- --------------------------------------------------------------- --
--	                      USER INTERESTS                           --
-- --------------------------------------------------------------- --

CREATE TYPE user_interest as ENUM (
	'subscribed',
	'neutral',
	'blocked'
);

CREATE TABLE user_interests (
	user_id BIGINT REFERENCES users ON DELETE CASCADE,
	interest user_interest NOT NULL DEFAULT ('neutral')
);

CREATE TABLE user_interests_tag (
	tag_id INT REFERENCES tags ON DELETE CASCADE,
	PRIMARY KEY (user_id, tag_id)
) INHERITS (user_interests);

CREATE TABLE user_interests_category (
	category_id INT REFERENCES categories ON DELETE CASCADE,
	PRIMARY KEY (category_id, user_id)
) INHERITS (user_interests);

-- --------------------------------------------------------------- --
--	                          CHAT                                 --
-- --------------------------------------------------------------- --

CREATE TABLE chat_sessions (
	chat_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	chat_name TEXT,
	created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chat_members (
	user_id BIGINT REFERENCES users ON DELETE CASCADE,
	chat_id BIGINT REFERENCES chat_sessions ON DELETE CASCADE,
	role role,
	created_at TIMESTAMPTZ DEFAULT now(),
	PRIMARY KEY (user_id, chat_id)
);

CREATE TABLE chat_messages (
	chat_message_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	user_id BIGINT REFERENCES users ON DELETE SET NULL,
	chat_id BIGINT REFERENCES chat_sessions ON DELETE CASCADE,
	body TEXT,
	attachments JSONB,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	edited_at TIMESTAMPTZ
);
CREATE INDEX chat_message_session ON chat_messages (chat_id);
CREATE OR REPLACE TRIGGER chat_edit_time 
	BEFORE UPDATE ON chat_messages
	FOR EACH ROW EXECUTE FUNCTION updateEditTime();


-- --------------------------------------------------------------- --
--	                           MISC                                --
-- --------------------------------------------------------------- --

CREATE TYPE platform AS ENUM('desktop', 'mobile');
CREATE TYPE browser AS ENUM('chrome', 'opera', 'safari', 'firefox', 'edge', 'unknown');

CREATE TABLE login_sessions (
	session_id TEXT UNIQUE NOT NULL PRIMARY KEY,
	user_uid TEXT REFERENCES users(user_uid) ON DELETE CASCADE,
	session_platform platform NOT NULL,
	session_browser browser NOT NULL,
 	created_at TIMESTAMPTZ DEFAULT now(),
	expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE notifications (
	notif_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	user_id BIGINT UNIQUE NOT NULL REFERENCES users ON DELETE CASCADE,
	node_id BIGINT REFERENCES nodes ON DELETE CASCADE,
	created_at TIMESTAMPTZ DEFAULT now()
);
