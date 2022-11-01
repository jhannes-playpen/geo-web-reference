FROM maven:3-openjdk-17 as build

COPY pom.xml .
RUN mvn dependency:go-offline

COPY tsconfig.json .
COPY package.json .
COPY package-lock.json .
RUN mvn initialize
RUN mvn dependency:copy-dependencies

COPY src src
RUN mvn test

FROM amazoncorretto:17

RUN mkdir -p /app/lib
COPY --from=build target/dependency/* /app/lib/
COPY --from=build target/classes /app/classes

WORKDIR /app
CMD ["java", "-classpath", "/app/classes:/app/lib/*", "no.kristiania.webmap.WebMapServer", "start"]

