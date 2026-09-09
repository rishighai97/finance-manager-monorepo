-- account_type: create sequence + table
CREATE SEQUENCE IF NOT EXISTS account_type_sequence START 1;

CREATE TABLE account_type (
                id int PRIMARY KEY DEFAULT nextval('account_type_sequence'), 
                type_1 varchar(20), 
                type_2 varchar(20), 
                type_3 varchar(20)
            );
