-- Racchabanda initial schema
-- Run once against a fresh PostgreSQL database.

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_telugu VARCHAR(100),
  slug VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- request | typo | region | feedback
  region VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id),
  mongo_user_id VARCHAR(50) NOT NULL,
  title VARCHAR(300) NOT NULL,
  body TEXT,
  image_url VARCHAR(500),
  post_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  region VARCHAR(100),
  word VARCHAR(200),
  word_telugu VARCHAR(200),
  yaasalu_word_url VARCHAR(500),
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS replies (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  mongo_user_id VARCHAR(50) NOT NULL,
  body TEXT NOT NULL,
  is_admin_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  mongo_user_id VARCHAR(50) NOT NULL,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  reply_id INTEGER REFERENCES replies(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT one_vote_per_post UNIQUE (mongo_user_id, post_id),
  CONSTRAINT one_vote_per_reply UNIQUE (mongo_user_id, reply_id)
);

CREATE TABLE IF NOT EXISTS definitions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  mongo_user_id VARCHAR(50) NOT NULL,
  definition TEXT NOT NULL,
  example VARCHAR(500),
  region VARCHAR(100),
  is_top_answer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------

INSERT INTO categories (name, name_telugu, slug, type, description) VALUES
('Request a word', 'మాట అడగండి', 'request-a-word', 'request', 'Missing a word from the dictionary? Ask the community'),
('Telugu typos', 'తప్పుల తడక', 'telugu-typos', 'typo', 'Autocorrect disasters, WhatsApp blunders, keyboard chaos'),
('Feedback', 'అభిప్రాయం', 'feedback', 'feedback', 'Bug reports, feature requests, section suggestions, word quality issues')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, name_telugu, slug, type, region, description) VALUES
('Uttarandhra', 'ఉత్తరాంధ్ర', 'uttarandhra', 'region', 'uttarandhra', 'Srikakulam, Vizianagaram, Visakhapatnam dialects'),
('Rayalaseema', 'రాయలసీమ', 'rayalaseema', 'region', 'rayalaseema', 'Kurnool, Kadapa, Anantapur, Chittoor dialects'),
('Telangana', 'తెలంగాణ', 'telangana', 'region', 'telangana', 'Hyderabad, Warangal, Nizamabad dialects'),
('Kosta', 'కోస్తా', 'kosta', 'region', 'kosta', 'Krishna, Guntur, West and East Godavari dialects'),
('Diaspora', 'డయాస్పోరా', 'diaspora', 'region', 'diaspora', 'Malaysia, Sri Lanka, US, UK, Fiji, South Africa')
ON CONFLICT (slug) DO NOTHING;
