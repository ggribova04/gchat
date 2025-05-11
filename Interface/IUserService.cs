using gchat_backend.DTO;

namespace gchat_backend.Interface
{
    public interface IUserService
    {
        Task<UserDto> GetProfileAsync(string userId);
        Task<UserDto> UpdateNickNameAsync(string userId, string newNickName);
        Task<UserSettingsDto> UpdateThemeAsync(string userId, string theme);
        Task<UserSettingsDto> UpdateLanguageAsync(string userId, string language);
        Task ChangePasswordAsync(string userId, ChangePasswordDto dto);
        Task<string> UploadAvatarAsync(string userId, IFormFile file);
        Task RemoveAvatarAsync(string userId);
    }
}
