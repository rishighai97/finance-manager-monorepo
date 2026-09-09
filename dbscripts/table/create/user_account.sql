-- user_account: create sequence + table
CREATE SEQUENCE IF NOT EXISTS user_account_sequence START 1;

CREATE TABLE user_account (
                id int PRIMARY KEY DEFAULT nextval('user_account_sequence'), 
                account_id serial references account, 
                user_id serial references user_detail, 
                user_account_name varchar(300)
            );
