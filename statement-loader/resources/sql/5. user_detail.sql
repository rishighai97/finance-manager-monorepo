
CREATE SEQUENCE user_detail_sequence START 1;

CREATE TABLE user_detail  (
  id int PRIMARY KEY DEFAULT nextval('user_detail_sequence'),
  name varchar(200) not null
);

insert into user_detail (id, name)
values
(1, 'Rishi Ghai'),
(2, 'Sujata Ghai'),
(3, 'Naresh Ghai'),
(4, 'Rohan Ghai');

SELECT setval('user_detail_sequence', (SELECT MAX(id) FROM user_detail));

select * from user_detail;