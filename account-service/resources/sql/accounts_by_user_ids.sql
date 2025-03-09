select
	ua.id as user_account_id,
	ua.account_id,
	ua.user_id,
	type_id as account_type_id,
	name as account_name,
	type_1 as account_type_1,
	type_2 as account_type_2,
	type_3 as account_type_3
from
	user_account ua
join account a on
	ua.account_id = a.id
join account_type at2 on
	at2.id = a.type_id
join
where
	user_id in (1)