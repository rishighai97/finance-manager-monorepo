
CREATE SEQUENCE user_account_sequence START 1;

CREATE TABLE user_account  (
  id int PRIMARY KEY DEFAULT nextval('user_account_sequence'),
  account_id serial references account,
  user_id serial references user_detail,
  user_account_name varchar(300)
);


insert into user_account (id, account_id, user_id, user_account_name)
values
(1, 1, 1, 'HDFC RISHI'),
(2, 2, 1, 'ICICI RISHI'),
(3, 3, 1, 'SARASWAT RISHI'),
(4, 4, 1, 'CANARA RISHI'),
(5, 5, 1, 'AXIS RISHI'),
(6, 7, 1, 'GROWW, GROW RISHI');

SELECT setval('user_account_sequence', (SELECT MAX(id) FROM user_account));

select * from user_account;