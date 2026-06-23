# Backend service (Spring Boot) — deploy this as a Railway service with
# root directory "/" (repo root). Railway sets PORT and (if you add a MySQL
# plugin) DB-related reference variables automatically — see deploy/RAILWAY.md.

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /build/target/flexiwork.jar app.jar

# Railway injects PORT; application.yml binds server.port to it.
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
