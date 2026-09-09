-- account: create sequence + table
CREATE SEQUENCE IF NOT EXISTS account_sequence START 1;

CREATE TABLE account (
                  id int PRIMARY KEY DEFAULT nextval('account_sequence'), 
                  type_id serial references account_type, 
                  icon_id serial references account_icon, 
                  name varchar(30) not null
              );
