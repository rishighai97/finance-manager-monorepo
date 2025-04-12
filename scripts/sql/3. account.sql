CREATE SEQUENCE account_sequence START 1;
CREATE TABLE account (
  id int PRIMARY KEY DEFAULT nextval('account_sequence'),
  type_id serial references account_type,
  icon_id serial references account_icon,
  name varchar(30) not null
);


insert into account (id, type_id, name, icon_id)
values (1, 1, 'hdfc', 1),
(2, 1, 'icici', 2),
(3, 1, 'saraswat', 3),
(4, 1, 'canara', 4),
(5, 1, 'axis', 5),
(6, 1, 'tjsb', 6),
(7, 4, 'groww', 7);

SELECT setval('account_sequence', (SELECT MAX(id) FROM account));

select * from account;