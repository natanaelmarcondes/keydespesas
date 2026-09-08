using KeyDespesas.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("KeySolutionCors", policy =>
    {
        policy
            .WithOrigins(
                "https://www.keysolution.com.br",
                "https://keysolution.com.br",
                "http://localhost:4200"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// DbContext (MySQL + Pomelo)
var cs = builder.Configuration.GetConnectionString("MySql");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseMySql(cs, ServerVersion.AutoDetect(cs));
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Rodando só HTTP agora
// app.UseHttpsRedirection();

// IMPORTANTE: antes do MapControllers
app.UseCors("KeySolutionCors");

app.MapControllers();

app.Run();