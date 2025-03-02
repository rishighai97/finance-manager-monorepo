CREATE TABLE transaction  (
  id varchar (200) unique primary key,
  date date not null,
  user_id serial not null references user,
  account_id serial not null references account,
  title varchar (100) not null,
  amount numeric not null,
  debit_credit_indicator varchar(2) not null,
  closing_balance numeric,
  category_id varchar (200),
  units numeric,
  price_per_unit numeric
);