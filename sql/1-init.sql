DROP SCHEMA public cascade;
CREATE SCHEMA public;


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

CREATE TYPE node_ref AS ENUM (
	'posts',
	'comments'
);

CREATE FUNCTION create_node() RETURNS TRIGGER AS $$
DECLARE
	ref_table node_ref := TG_ARGV[0];
	id_column TEXT := TG_ARGV[1];
	new_node_id BIGINT;
BEGIN
	INSERT INTO nodes (node_ref) VALUES (ref_table) 
		RETURNING node_id INTO new_node_id;
	EXECUTE (FORMAT(
		'UPDATE %I SET node_id = %L WHERE %I = $1.%I',
		ref_table, new_node_id, id_column, id_column
	)) USING NEW;
	RETURN NULL;
END $$ LANGUAGE 'plpgsql';

CREATE FUNCTION remove_node() RETURNS TRIGGER AS $$
BEGIN
	DELETE FROM nodes WHERE node_id = OLD.node_id;
	RETURN NULL;
END $$ LANGUAGE 'plpgsql';

CREATE TABLE nodes (
	node_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	parent_node_id BIGINT REFERENCES nodes ON DELETE CASCADE,
	node_ref node_ref
);
CREATE INDEX node_parent ON nodes (parent_node_id);
CREATE INDEX node_ref ON nodes (node_ref);

CREATE TABLE posts (
	node_id BIGINT UNIQUE REFERENCES nodes ON DELETE CASCADE,
	post_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	post_uid TEXT NOT NULL UNIQUE,
	post_slug TEXT,
	user_id INT NOT NULL REFERENCES users ON DELETE CASCADE,
	title TEXT NOT NULL,
	summary TEXT,
	visible BOOLEAN DEFAULT TRUE,
	num_views INT NOT NULL DEFAULT 0,
	body JSONB NOT NULL,
	post_ts_vector TSVECTOR GENERATED ALWAYS AS (
		to_tsvector('english', title ||' '||summary) || 
		to_tsvector('english', body)
	) STORED,
	created_at TIMESTAMPTZ DEFAULT now(),
	edited_at TIMESTAMPTZ
);
CREATE INDEX post_author ON posts (user_id);
CREATE INDEX post_node ON posts (node_id);
CREATE TRIGGER post_edit_time
	BEFORE UPDATE ON posts
	FOR EACH ROW EXECUTE FUNCTION updateEditTime();
CREATE TRIGGER remove_post_node
	AFTER DELETE ON posts
	FOR EACH ROW EXECUTE FUNCTION remove_node();

/**
 * Create a post, its node, and link them.
 * Allows passing and setting the node's parent node 
 * in one go.
 */
CREATE FUNCTION create_post(
	p_user_id BIGINT,
	p_post_uid TEXT,
	p_title TEXT,
	p_body JSONB,
	p_post_slug TEXT DEFAULT NULL,
	p_summary TEXT DEFAULT NULL,
	p_visible BOOLEAN DEFAULT TRUE,
	p_parent_node_id BIGINT DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
	new_node_id BIGINT;
BEGIN
	INSERT INTO posts 
		(post_uid, post_slug, user_id, title, summary, visible, body)
		VALUES
		(p_post_uid, p_post_slug, p_user_id, p_title, p_summary, p_visible, p_body);
	INSERT INTO nodes (parent_node_id) VALUES (p_parent_node_id)
		RETURNING node_id into new_node_id;
	UPDATE posts SET node_id = new_node_id WHERE post_uid = p_post_uid;
	RETURN new_node_id;
END $$ LANGUAGE 'plpgsql';
	
	
CREATE TABLE post_user_views (
	post_id BIGINT NOT NULL REFERENCES posts ON DELETE CASCADE,
	user_id BIGINT NOT NULL REFERENCES users ON DELETE CASCADE,
	PRIMARY KEY (post_id, user_id)
);
	
CREATE TABLE comments (
	node_id BIGINT UNIQUE REFERENCES nodes ON DELETE CASCADE,
	comment_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	comment_uid TEXT NOT NULL UNIQUE,
	user_id BIGINT REFERENCES users ON DELETE SET NULL,
	body JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
	edited_at TIMESTAMPTZ
);
CREATE OR REPLACE TRIGGER comment_edit_log
	BEFORE UPDATE ON comments
	FOR EACH ROW EXECUTE FUNCTION updateEditTime();
CREATE TRIGGER remove_comment_node
	AFTER DELETE ON comments
	FOR EACH ROW EXECUTE FUNCTION remove_node();
	
/**
 * Create a comment, its node, and link them.
 * Allows passing and setting the node's parent 
 * node in one go.
 */
CREATE FUNCTION create_comment(
	p_comment_uid TEXT,
	p_user_id BIGINT,
	p_body JSONB,
	p_parent_node_id BIGINT
) RETURNS BIGINT AS $$
DECLARE 
	new_node_id BIGINT;
BEGIN
	INSERT INTO comments (user_id, comment_uid, body)
		VALUES (p_user_id, p_comment_uid, p_body);
	INSERT INTO nodes (parent_node_id, node_ref) VALUES (p_parent_node_id, 'comments')
		RETURNING node_id INTO new_node_id;
	UPDATE comments SET node_id = new_node_id WHERE comment_uid = p_comment_uid;
	RETURN new_node_id;
END $$ LANGUAGE 'plpgsql';
	
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
--	                         EMOTES                                --
-- --------------------------------------------------------------- --

CREATE TYPE emote_pack_sharing AS ENUM (
	'open',
	'invite',
	'closed'
);

CREATE TABLE emote_packs (
	emote_pack_id SERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL REFERENCES users ON DELETE CASCADE,
	pack_name TEXT NOT NULL,
	thumbnail_url TEXT,
	emote_pack_sharing emote_pack_sharing NOT NULL DEFAULT ('invite'),
	UNIQUE (pack_name, user_id)
);
COMMENT ON COLUMN emote_packs.user_id IS 'Creator/Owner';

CREATE TABLE emote_pack_access (
	emote_pack_id INT NOT NULL REFERENCES emote_packs ON DELETE CASCADE,
	user_id BIGINT NOT NULL REFERENCES users ON DELETE CASCADE,
	PRIMARY KEY (emote_pack_id, user_id)
);

CREATE TABLE emotes (
	emote_id SERIAL PRIMARY KEY,
	emote_pack_id INT NOT NULL REFERENCES emote_packs ON DELETE CASCADE,
	keyword TEXT NOT NULL,
	image_url TEXT NOT NULL UNIQUE,
	created_at TIMESTAMPTZ DEFAULT now(),
	edited_at TIMESTAMPTZ
);
CREATE INDEX emote_pack_member on emotes (emote_pack_id);
CREATE INDEX emote_keyword ON emotes (keyword);
CREATE OR REPLACE TRIGGER emote_edit_time 
	BEFORE UPDATE ON emotes
	FOR EACH ROW EXECUTE FUNCTION updateEditTime();


-- --------------------------------------------------------------- --
--	                     NODE ACCESSORIES                          --
-- --------------------------------------------------------------- --

CREATE TABLE node_emotes (
	node_id BIGINT REFERENCES nodes ON DELETE CASCADE,
	user_id BIGINT NOT NULL REFERENCES users ON DELETE CASCADE,
	emote_id INT NOT NULL REFERENCES emotes ON DELETE CASCADE,
 	created_at TIMESTAMPTZ DEFAULT now(),
	PRIMARY KEY (node_id, user_id, emote_id)
);

CREATE TABLE node_tags (
	node_id BIGINT REFERENCES nodes ON DELETE CASCADE,
	tag_id INT REFERENCES tags,
	PRIMARY KEY (node_id, tag_id)
);

CREATE TABLE node_categories (
	node_id BIGINT REFERENCES nodes ON DELETE CASCADE,
	category_id INT REFERENCES categories ON DELETE CASCADE,
	PRIMARY KEY (node_id, category_id)
);

CREATE TABLE node_follows (
	node_id BIGINT REFERENCES nodes ON DELETE CASCADE,
	follower_id BIGINT REFERENCES users ON DELETE CASCADE
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
