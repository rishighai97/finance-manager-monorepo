CREATE TABLE account (
  id serial primary key,
  account_type_id serial references account_type,
  name varchar(30) not null
);