using KeyDespesas.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

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

// Rodando só HTTP agora (evita confusão):
// app.UseHttpsRedirection();

app.MapControllers();
app.Run();
