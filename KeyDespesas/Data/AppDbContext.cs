using KeyDespesas.Models;
using Microsoft.EntityFrameworkCore;

namespace KeyDespesas.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Titulo> Titulos => Set<Titulo>();
        public DbSet<Categoria> Categorias => Set<Categoria>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // CATEGORIAS
            modelBuilder.Entity<Categoria>(e =>
            {
                e.ToTable("categorias");
                e.HasKey(x => x.Id);

                e.Property(x => x.Id).HasColumnName("id");
                e.Property(x => x.Nome).HasColumnName("nome").HasMaxLength(80).IsRequired();
            });

            // TITULOS
            modelBuilder.Entity<Titulo>(e =>
            {
                e.ToTable("titulos");
                e.HasKey(x => x.Id);

                e.Property(x => x.Id).HasColumnName("id");

                e.Property(x => x.Tipo)
                    .HasColumnName("tipo")
                    .HasMaxLength(1)
                    .IsRequired();

                e.Property(x => x.Descricao)
                    .HasColumnName("descricao")
                    .HasMaxLength(150)
                    .IsRequired();

                e.Property(x => x.IdCategoria)
                    .HasColumnName("id_categoria")
                    .IsRequired();

                e.Property(x => x.DataEmissao)
                    .HasColumnName("data_emissao")
                    .HasColumnType("date")
                    .IsRequired();

                e.Property(x => x.DataVencimento)
                    .HasColumnName("data_vencimento")
                    .HasColumnType("date")
                    .IsRequired();

                e.Property(x => x.Valor)
                    .HasColumnName("valor")
                    .HasPrecision(15, 2)
                    .IsRequired();

                e.Property(x => x.Status)
                    .HasColumnName("status")
                    .HasMaxLength(10)
                    .IsRequired();
            });
        }
    }
}
