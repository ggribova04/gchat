using Microsoft.EntityFrameworkCore;

namespace gchat_backend.DB
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<UserSettings> UserSettings { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Language> Languages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
                .HasIndex(u => u.UserName)
                .IsUnique();

            // Связь 1 к 1 (User ↔ UserSettings)
            modelBuilder.Entity<User>()
                .HasOne(u => u.Settings)
                .WithOne(s => s.User)
                .HasForeignKey<UserSettings>(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Связь 1 ко многим (User ↔ Message)
            modelBuilder.Entity<Message>()
                .HasOne(m => m.User)
                .WithMany(u => u.Messages)
                .HasForeignKey(m => m.UserId);

            // Заполняем языки
            modelBuilder.Entity<Language>()
                .HasKey(l => l.Code);

            modelBuilder.Entity<Language>().HasData(
                new Language { Code = "ru", Name = "Русский" },
                new Language { Code = "en", Name = "English" }
            );
        }
    }
}
