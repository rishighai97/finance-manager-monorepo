CREATE TABLE account_statement  (
  id serial unique primary key,
  extension varchar(10) not null,
  version integer not null,
  start_time timestamp not null,
  end_time timestamp not null,
  account_id serial references account
);
