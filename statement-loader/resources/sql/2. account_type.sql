CREATE SEQUENCE account_type_sequence START 1;

CREATE TABLE account_type  (
  id int PRIMARY KEY DEFAULT nextval('account_type_sequence'),
  type_1 varchar(20),
  type_2 varchar(20),
  type_3 varchar(20)
);


insert into account_type (id, type_1, type_2, type_3)
values (1, 'cash', 'bank', 'savings'),
(2, 'cash', 'bank', 'current'),
(3, 'cash', 'wallet', null),
(4, 'investment', 'mutual_fund', null),
(5, 'investment', 'share', null);

SELECT setval('account_type_sequence', (SELECT MAX(id) FROM account_type));

select * from account_type;