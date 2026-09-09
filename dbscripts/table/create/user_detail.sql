-- user_detail: create sequence + table
CREATE SEQUENCE IF NOT EXISTS user_detail_sequence START 1;

CREATE TABLE IF NOT EXISTS user_detail (
                id int PRIMARY KEY DEFAULT nextval('user_detail_sequence'), 
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE,
                last_login TIMESTAMP,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            );
