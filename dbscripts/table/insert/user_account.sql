-- user_account: sample data
INSERT INTO user_account (id, account_id, user_id, user_account_name) VALUES
(1, 1, 1, 'HDFC RISHI'),
(2, 2, 1, 'ICICI RISHI'),
(3, 3, 1, 'SARASWAT RISHI'),
(4, 4, 1, 'CANARA RISHI'),
(5, 5, 1, 'AXIS RISHI'),
(6, 7, 1, 'GROWW, GROW RISHI');

SELECT setval('user_account_sequence', (SELECT MAX(id) FROM user_account));
