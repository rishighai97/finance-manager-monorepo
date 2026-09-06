# statement-loader
Loads transactions from account statements into our system



id serial unique primary key,
  extension varchar(10) not null,
  version integer not null,
  start_time timestamp not null,
  end_time timestamp not null,
  account_id serial references account






account_id
-> account_statements



timestamp and extension -> id

[based on timestamp, extension and account_id]
map[[account_id, extension, version], statement]



map[[account_id, extension, version], handler]

