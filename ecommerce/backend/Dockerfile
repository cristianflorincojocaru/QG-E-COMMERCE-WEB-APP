# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and restore dependencies first (Docker layer cache optimisation)
COPY ECommerce.sln .
COPY ECommerceAPI/ECommerceAPI.csproj ECommerceAPI/
COPY ECommerceAPI.Tests/ECommerceAPI.Tests.csproj ECommerceAPI.Tests/

RUN dotnet restore ECommerce.sln

# Copy the rest of the source and build
COPY . .
RUN dotnet publish ECommerceAPI/ECommerceAPI.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# ── Stage 2: Runtime ───────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Create a directory for Serilog file logs
RUN mkdir -p /app/logs

COPY --from=build /app/publish .

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "ECommerceAPI.dll"]
