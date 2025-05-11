namespace gchat_backend.DB
{
    public class UserSettings
    {
        public int Id { get; set; }
        public string Theme { get; set; } = "light";
        public string PhotoUrl { get; set; } = "/images/default_photo.png";
        public string Language { get; set; } = "ru";

        public int UserId { get; set; }
        public User User { get; set; }
    }
}
