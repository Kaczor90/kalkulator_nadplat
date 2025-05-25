#!/bin/bash

# Skrypt do uruchomienia aplikacji z połączeniem do zewnętrznej bazy danych MongoDB
# Użycie: ./connect-external-db.sh "mongodb://użytkownik:hasło@host:port/baza-danych"

if [ -z "$1" ]; then
  echo "Proszę podać connection string do bazy danych MongoDB"
  echo "Przykład: ./connect-external-db.sh \"mongodb://użytkownik:hasło@host:port/baza-danych\""
  exit 1
fi

# Zapisz connection string do zmiennej
MONGODB_URI=$1

# Zatrzymaj istniejące kontenery (oprócz bazy danych)
docker-compose stop proxy frontend backend

# Uruchom aplikację z podanym connection string
docker-compose -f docker-compose.yml up -d --no-deps proxy frontend backend \
  -e MONGODB_URI="$MONGODB_URI"

echo "Aplikacja uruchomiona z połączeniem do zewnętrznej bazy danych: $MONGODB_URI"
echo "Frontend: http://localhost"
echo "Backend API: http://localhost/api"
echo "Swagger: http://localhost/api/docs" 