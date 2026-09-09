-- transaction: create sequence + table
CREATE TABLE transaction (
                id text PRIMARY KEY NOT NULL UNIQUE, 
                date date not null, 
                user_account_id serial not null references user_account, 
                title text not null, amount numeric not null, 
                debit_credit_indicator varchar(2) not null, 
                closing_balance numeric, 
                category_id varchar(200), 
                units numeric, 
                price_per_unit numeric
            );
