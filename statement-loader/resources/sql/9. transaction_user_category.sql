
CREATE SEQUENCE transaction_user_category_sequence START 1;

CREATE TABLE transaction_user_category  (
  id int PRIMARY KEY DEFAULT nextval('transaction_user_category_sequence'),
  transaction_id text references transaction,
  user_category_id serial references user_detail,
  unique(transaction_id, user_category_id)
);


insert into transaction_user_category (id, transaction_id, user_category_id)
values
(1, '1|2024-05-24|MSAS SAL MAY24', 1);

SELECT setval('transaction_user_category_sequence', (SELECT MAX(id) FROM transaction_user_category));

select * from transaction_user_category;