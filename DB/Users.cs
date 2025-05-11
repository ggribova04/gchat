namespace gchat_backend.DB
{
    public class User
    {
        public int Id { get; set; }
        public string NickName { get; set; }
        public string UserName { get; set; }
        public string PasswordHash { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public UserSettings Settings { get; set; }

        public List<Message> Messages { get; set; } = new();
    }
}
