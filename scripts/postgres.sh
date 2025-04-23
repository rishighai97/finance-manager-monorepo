mkdir -p /finance-manager-application-postgres-data
chmod -R 700 /finance-manager-application-postgres-data
docker run --name finance-manager-application-postgres -e POSTGRES_PASSWORD=admin -e POSTGRES_USER=postgres -p 5432:5432   --restart=always -v /postgres_data/var/lib/postgresql/data -d postgres
