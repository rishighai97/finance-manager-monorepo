-- user_category: sample data
INSERT INTO user_category (id, user_id, category_title) VALUES
(1, 1, 'SALARY'),
(2, 1, 'FOOD'),
(3, 1, 'LUNCH'),
(4, 1, 'DINNER'),
(5, 1, 'SNACKS');

SELECT setval('user_category_sequence', (SELECT MAX(id) FROM user_category));
