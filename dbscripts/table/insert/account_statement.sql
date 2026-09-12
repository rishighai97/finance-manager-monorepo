-- account_statement: sample data
INSERT INTO account_statement (extension, version, account_id, start_time, end_time) VALUES
('xls', 0 , 1, '2025-02-01 05:29:56.830', '2025-03-01 05:29:56.830'),
('xls', 1 , 1, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('csv', 1 , 1, timezone('utc', now()), '9999-01-01 01:00:00.000'),
-- HDFC's pdf format transitions from v1 to v2 on 2027-01-01 - a synthetic
-- format-drift demonstration for jira/JIRA_11.md's statement-onboard skill
-- (HdfcSavingsAccountPdfV2StatementReader), not a real future HDFC change.
('pdf', 1 , 1, timezone('utc', now()), '2027-01-01 00:00:00.000'),
('pdf', 2 , 1, '2027-01-01 00:00:00.000', '9999-01-01 01:00:00.000'),
('xls', 1 , 2, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('pdf', 1 , 2, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('xls', 1 , 3, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('pdf', 1 , 3, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('csv', 1 , 4, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('pdf', 1 , 4, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('csv', 1 , 5, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('xls', 1 , 5, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('pdf', 1 , 5, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('xls', 1 , 6, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('pdf', 1 , 6, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('xlsx', 1 , 7, timezone('utc', now()), '9999-01-01 01:00:00.000'),
('xls', 1 , 7, '2025-03-01 05:29:56.830', '9999-01-01 05:29:56.830'),
('pdf', 1 , 7, timezone('utc', now()), '9999-01-01 01:00:00.000'),
-- JIRA_18: American Express credit card statement (new account id 8).
('xlsx', 1 , 8, timezone('utc', now()), '9999-01-01 01:00:00.000');

SELECT setval('account_statement_sequence', (SELECT MAX(id) FROM account_statement));
