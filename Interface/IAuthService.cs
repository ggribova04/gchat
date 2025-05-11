using gchat_backend.DTO;

namespace gchat_backend.Interface
{
    public interface IAuthService
    {
        Task<AuthResultDto> RegisterAsync(UserRegisterDto dto);
        Task<AuthResultDto> LoginAsync(UserLoginDto dto);
    }
}
