using KeyDespesas.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace KeyDespesas.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Titulo> Titulos => Set<Titulo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Categoria>(e =>
        {
            e.ToTable("categorias");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Nome).HasColumnName("nome").HasMaxLength(80).IsRequired();
        });

        modelBuilder.Entity<Titulo>(e =>
        {
            e.ToTable("titulos");
            e.HasKey(x => x.Id);

            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Tipo).HasColumnName("tipo").HasColumnType("enum('P','R')").IsRequired();
            e.Property(x => x.Descricao).HasColumnName("descricao").HasMaxLength(150).IsRequired();

            e.Property(x => x.IdCategoria).HasColumnName("id_categoria").IsRequired();
            e.HasOne(x => x.Categoria)
             .WithMany()
             .HasForeignKey(x => x.IdCategoria);

            e.Property(x => x.DataEmissao).HasColumnName("data_emissao").HasColumnType("date").IsRequired();
            e.Property(x => x.DataVencimento).HasColumnName("data_vencimento").HasColumnType("date").IsRequired();

            e.Property(x => x.Valor).HasColumnName("valor").HasPrecision(15, 2).IsRequired();

            e.Property(x => x.Status)
             .HasColumnName("status")
             .HasColumnType("enum('ABERTO','PAGO','CANCELADO','VENCIDO')")
             .IsRequired();

            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        });
    }
}
