using gchat_backend.DTO;
using gchat_backend.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace gchat_backend
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        private string GetUserId() =>
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new Exception("User ID not found");

        [HttpGet("profile")]
        public async Task<ActionResult<UserDto>> GetProfile()
        {
            var profile = await _userService.GetProfileAsync(GetUserId());
            return Ok(profile);
        }

        [HttpPut("nickname")]
        public async Task<ActionResult<UserDto>> UpdateNickName([FromBody] UpdateNickNameDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.NewNickName))
                return BadRequest("Никнейм не может быть пустым");

            var updated = await _userService.UpdateNickNameAsync(GetUserId(), dto.NewNickName);
            return Ok(updated);
        }

        [HttpPut("theme")]
        public async Task<ActionResult<UserSettingsDto>> UpdateTheme([FromBody] UpdateThemeDto dto)
        {
            return Ok(await _userService.UpdateThemeAsync(GetUserId(), dto.Theme));
        }

        [HttpPut("language")]
        public async Task<ActionResult<UserSettingsDto>> UpdateLanguage([FromBody] UpdateLanguageDto dto)
        {
            return Ok(await _userService.UpdateLanguageAsync(GetUserId(), dto.Language));
        }

        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            await _userService.ChangePasswordAsync(GetUserId(), dto);
            return NoContent();
        }

        [HttpPost("avatar")]
        public async Task<ActionResult<string>> UploadAvatar([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Файл не загружен");

            var url = await _userService.UploadAvatarAsync(GetUserId(), file);
            return Ok(new { photoUrl = url });
        }

        [HttpDelete("avatar")]
        public async Task<IActionResult> RemoveAvatar()
        {
            await _userService.RemoveAvatarAsync(GetUserId());
            return NoContent();
        }
    }
}
