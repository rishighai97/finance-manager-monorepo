-- user_category: create sequence + table
CREATE SEQUENCE IF NOT EXISTS user_category_sequence START 1;

CREATE TABLE user_category (
                id int PRIMARY KEY DEFAULT nextval('user_category_sequence'), 
                user_id serial references user_detail, 
                category_title varchar(300)
            );
