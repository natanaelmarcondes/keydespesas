using KeyDespesas.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace KeyDespesas.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Categoria> Categorias => Set<Categoria>();

    public DbSet<Titulo> Titulos => Set<Titulo>();

    public DbSet<Anotacao> Anotacoes => Set<Anotacao>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Categoria>(e =>
        {
            e.ToTable("categorias");

            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
                .HasColumnName("id");

            e.Property(x => x.Nome)
                .HasColumnName("nome")
                .HasMaxLength(80)
                .IsRequired();
        });

        modelBuilder.Entity<Titulo>(e =>
        {
            e.ToTable("titulos");

            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
                .HasColumnName("id");

            e.Property(x => x.Tipo)
                .HasColumnName("tipo")
                .HasColumnType("enum('P','R')")
                .IsRequired();

            e.Property(x => x.Descricao)
                .HasColumnName("descricao")
                .HasMaxLength(150)
                .IsRequired();

            e.Property(x => x.IdCategoria)
                .HasColumnName("id_categoria")
                .IsRequired();

            e.HasOne(x => x.Categoria)
                .WithMany()
                .HasForeignKey(x => x.IdCategoria)
                .OnDelete(DeleteBehavior.Restrict);

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
                .HasColumnType("enum('ABERTO','PAGO','CANCELADO','VENCIDO')")
                .IsRequired();

            e.Property(x => x.CreatedAt)
                .HasColumnName("created_at");

            e.Property(x => x.UpdatedAt)
                .HasColumnName("updated_at");
        });

        modelBuilder.Entity<Anotacao>(e =>
        {
            e.ToTable("anotacoes");

            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
                .HasColumnName("ant_Id")
                .ValueGeneratedOnAdd();

            e.Property(x => x.Titulo)
                .HasColumnName("ant_Titulo")
                .HasMaxLength(200)
                .IsRequired();

            e.Property(x => x.Descricao)
                .HasColumnName("ant_Descricao")
                .HasColumnType("text")
                .IsRequired(false);

            e.Property(x => x.DataCriacao)
                .HasColumnName("ant_DataCriacao")
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .IsRequired();

            e.Property(x => x.DataAlteracao)
                .HasColumnName("ant_DataAlteracao")
                .HasColumnType("datetime")
                .IsRequired(false);

            e.Property(x => x.Arquivada)
                .HasColumnName("ant_Arquivada")
                .HasColumnType("char(1)")
                .HasMaxLength(1)
                .HasDefaultValue("N")
                .IsRequired();
        });
    }
}