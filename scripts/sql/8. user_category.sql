
CREATE SEQUENCE user_category_sequence START 1;

CREATE TABLE user_category  (
  id int PRIMARY KEY DEFAULT nextval('user_category_sequence'),
  user_id serial references user_detail,
  category_title varchar(300)
);


insert into user_category (id, user_id, category_title)
values
(1, 1, 'SALARY'),
(2, 1, 'FOOD'),
(3, 1, 'LUNCH'),
(4, 1, 'DINNER'),
(5, 1, 'SNACKS');

SELECT setval('user_category_sequence', (SELECT MAX(id) FROM user_category));

select * from user_category;