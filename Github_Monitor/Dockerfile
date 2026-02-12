# Estágio de Build
# Usamos uma imagem com Maven e JDK 21 para compilar o projeto
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copia apenas o pom.xml primeiro para aproveitar o cache de dependências
COPY pom.xml .
# Baixa as dependências (isso será cacheado se o pom.xml não mudar)
RUN mvn dependency:go-offline -B

# Copia o código fonte
COPY src ./src

# Compila o projeto e gera o arquivo .jar (pula os testes para ser mais rápido no deploy)
RUN mvn clean package -DskipTests

# Estágio de Execução
# Usamos uma imagem mais leve apenas com o JRE para rodar a aplicação
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copia o .jar gerado no estágio anterior
COPY --from=build /app/target/*.jar app.jar

# Define variáveis de ambiente padrão
# O Render define a variável PORT automaticamente, mas deixamos um padrão 8080
ENV PORT=8080
# No Render (servidor), não temos interface gráfica, então ativamos o modo headless
ENV HEADLESS_MODE=true

# Expõe a porta que a aplicação vai usar
EXPOSE 8080

# Comando para iniciar a aplicação
ENTRYPOINT ["java", "-jar", "app.jar"]
