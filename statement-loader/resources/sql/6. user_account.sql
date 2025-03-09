
CREATE SEQUENCE user_account_sequence START 1;

CREATE TABLE user_account  (
  id int PRIMARY KEY DEFAULT nextval('user_account_sequence'),
  account_id serial references account,
  user_id serial references user_detail
);


insert into user_account (id, account_id, user_id)
values
(1, 1, 1),
(2, 2, 1),
(3, 3, 1),
(4, 4, 1),
(5, 5, 1),
(6, 7, 1);

SELECT setval('user_account_sequence', (SELECT MAX(id) FROM user_account));

select * from user_account;