namespace gchat_backend.DTO
{
    public class ChatDto
    {
        public int UserId { get; set; }
        public string NickName { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
        public string? PhotoUrl { get; set; }
    }
}
