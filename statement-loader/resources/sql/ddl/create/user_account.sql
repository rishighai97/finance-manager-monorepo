CREATE TABLE user_account  (
  id serial unique primary key,
  account_id serial references account,
  user_id serial references user_detail
);