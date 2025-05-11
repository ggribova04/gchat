using gchat_backend.Interface;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using gchat_backend.DTO;
using System.Security.Claims;

namespace gchat_backend
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;

        public ChatController(IChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMessages()
        {
            var messages = await _chatService.GetAllMessagesAsync();
            return Ok(messages);
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] ChatDto dto)
        {
            // Получаем userId из JWT-токена
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return Unauthorized("Пользователь не найден в токене.");

            dto.UserId = int.Parse(userIdClaim.Value);

            if (string.IsNullOrWhiteSpace(dto.Message))
                return BadRequest("Пустое сообщение");

            var createdMessage = await _chatService.SendMessageAsync(dto);
            return Ok(createdMessage);
        }
    }
}
