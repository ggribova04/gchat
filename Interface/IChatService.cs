using gchat_backend.DTO;

namespace gchat_backend.Interface
{
    public interface IChatService
    {
        Task<IEnumerable<ChatDto>> GetAllMessagesAsync();
        Task<ChatDto> SendMessageAsync(ChatDto messageDto);
    }
}
