-- account_statement: create sequence + table
CREATE SEQUENCE IF NOT EXISTS account_statement_sequence START 1;

CREATE TABLE account_statement (
                id int PRIMARY KEY DEFAULT nextval('account_statement_sequence'), 
                extension varchar(10) not null, 
                version integer not null, 
                start_time timestamp not null, 
                end_time timestamp not null, 
                account_id serial references account
            );
