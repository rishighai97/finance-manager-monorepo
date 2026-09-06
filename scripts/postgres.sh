mkdir -p /finance_manager_application/postgres/data
chmod -R 700 /finance_manager_application/postgres/data
docker run --name finance-manager-application-postgres \
  -e POSTGRES_PASSWORD=admin \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=finance_manager \
  -p 5432:5432 \
  --restart=always \
  -v /finance_manager_application/postgres/data:/var/lib/postgresql/data \
  -d postgres