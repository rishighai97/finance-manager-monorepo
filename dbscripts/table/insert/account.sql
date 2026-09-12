-- account: sample data
INSERT INTO account (id, type_id, name, icon_id) VALUES 
(1, 1, 'hdfc', 1),
(2, 1, 'icici', 2),
(3, 1, 'saraswat', 3),
(4, 1, 'canara', 4),
(5, 1, 'axis', 5),
(6, 1, 'tjsb', 6),
(7, 4, 'groww', 7),
-- JIRA_18: new bank/account - American Express credit card (account_type
-- id 6, credit/card/null).
(8, 6, 'amex', 8);

SELECT setval('account_sequence', (SELECT MAX(id) FROM account));
