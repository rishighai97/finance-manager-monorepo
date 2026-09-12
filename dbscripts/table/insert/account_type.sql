-- account_type: sample data
INSERT INTO account_type (id, type_1, type_2, type_3) VALUES 
(1, 'cash', 'bank', 'savings'),
(2, 'cash', 'bank', 'current'),
(3, 'cash', 'wallet', null),
(4, 'investment', 'mutual_fund', null),
(5, 'investment', 'share', null),
-- JIRA_18: credit card statements (American Express) don't fit any
-- existing cash/bank or investment category.
(6, 'credit', 'card', null);

SELECT setval('account_type_sequence', (SELECT MAX(id) FROM account_type));
