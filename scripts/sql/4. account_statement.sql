
CREATE SEQUENCE account_statement_sequence START 1;

CREATE TABLE account_statement  (
  id int PRIMARY KEY DEFAULT nextval('account_statement_sequence'),
  extension varchar(10) not null,
  version integer not null,
  start_time timestamp not null,
  end_time timestamp not null,
  account_id serial references account
);


insert into account_statement (extension, version, account_id, start_time, end_time)
values
('xls', 0 , 1, '2025-02-01 05:29:56.830', '2025-03-01 05:29:56.830'),
('xls', 1 , 1, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('csv', 1 , 1, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('pdf', 1 , 1, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('xls', 1 , 2, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('pdf', 1 , 2, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('xls', 1 , 3, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('pdf', 1 , 3, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('csv', 1 , 4, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('pdf', 1 , 4, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('csv', 1 , 5, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('xls', 1 , 5, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('pdf', 1 , 5, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('xls', 1 , 6, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('pdf', 1 , 6, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('xlsx', 1 , 7, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('xls', 1 , 7, '2025-03-01 05:29:56.830', '9999-01-01 05:29:56.830'),
('pdf', 1 , 7, timezone('utc', now()), '9999-01-01 01:00:00.000');

SELECT setval('account_statement_sequence', (SELECT MAX(id) FROM account_statement));

select * from account_statement;
