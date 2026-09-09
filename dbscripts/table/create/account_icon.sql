-- account_icon: create sequence + table
CREATE SEQUENCE IF NOT EXISTS account_icon_sequence START 1;

CREATE TABLE account_icon (
                id int PRIMARY KEY DEFAULT nextval('account_icon_sequence'), 
                title varchar(100), icon text
            );
