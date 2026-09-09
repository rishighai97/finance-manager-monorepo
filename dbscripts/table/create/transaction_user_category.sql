-- transaction_user_category: create sequence + table
CREATE SEQUENCE IF NOT EXISTS transaction_user_category_sequence START 1;

CREATE TABLE transaction_user_category (
                id int PRIMARY KEY DEFAULT nextval('transaction_user_category_sequence'), 
                transaction_id text references transaction, 
                user_category_id serial references user_category, 
                unique(transaction_id, user_category_id)
            );
