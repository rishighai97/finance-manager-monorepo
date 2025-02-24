CREATE TABLE transaction  (
  id varchar (200) unique primary key,
  date date not null,
  account_id varchar (100) not null,
  title varchar (100) not null,
  amount numeric not null,
  debit_credit_indicator varchar(2) not null,
  closing_balance numeric,
  category_id varchar (200)
);