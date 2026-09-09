-- user_detail: sample data
INSERT INTO user_detail (id, username, password) VALUES
(1, 'Rishi Ghai', 'admin'),
(2, 'Sujata Ghai', 'admin'),
(3, 'Naresh Ghai', 'admin'),
(4, 'Rohan Ghai', 'admin');

SELECT setval('user_detail_sequence', (SELECT MAX(id) FROM user_detail));
