using gchat_backend.DTO;
using gchat_backend.Interface;
using gchat_backend.DB;
using Microsoft.EntityFrameworkCore;

namespace gchat_backend.Services
{
    public class ChatService : IChatService
    {
        private readonly AppDbContext _context;

        public ChatService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ChatDto>> GetAllMessagesAsync()
        {
            return await _context.Messages
                .Include(m => m.User)
                    .ThenInclude(u => u.Settings)
                .OrderBy(m => m.SentAt)
                .Select(m => new ChatDto
                {
                    UserId = m.UserId,
                    NickName = m.User.NickName,
                    Message = m.Text,
                    SentAt = m.SentAt,
                    PhotoUrl = m.User.Settings.PhotoUrl
                })
                .ToListAsync();
        }

        public async Task<ChatDto> SendMessageAsync(ChatDto dto)
        {
            var message = new Message
            {
                UserId = dto.UserId,
                Text = dto.Message,
                SentAt = DateTime.UtcNow
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(dto.UserId);
            var settings = await _context.UserSettings
                .FirstOrDefaultAsync(s => s.UserId == dto.UserId);

            return new ChatDto
            {
                UserId = message.UserId,
                NickName = user?.NickName ?? "Unknown",
                Message = message.Text,
                SentAt = message.SentAt,
                PhotoUrl = settings?.PhotoUrl ?? "/images/default_photo.png"
            };
        }
    }

}
