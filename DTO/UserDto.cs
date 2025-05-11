namespace gchat_backend.DTO
{
    public class UserDto
    {
        public int Id { get; set; }
        public string NickName { get; set; }
        public string UserName { get; set; }
        public DateTime CreatedAt { get; set; }
        public UserSettingsDto Settings { get; set; }
    }

    public class UserSettingsDto
    {
        public string Theme { get; set; }
        public string Language { get; set; }
        public string PhotoUrl { get; set; }
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
        public string ConfirmPassword { get; set; }
    }

    public class UpdateNickNameDto
    {
        public string NewNickName { get; set; }
    }

    public class UpdateThemeDto
    {
        public string Theme { get; set; }
    }

    public class UpdateLanguageDto
    {
        public string Language { get; set; }
    }

    public class UserRegisterDto
    {
        public string NickName { get; set; }
        public string UserName { get; set; }
        public string Password { get; set; }
        public string ConfirmPassword { get; set; }
        public string Language { get; set; } = "ru";
    }

    public class UserLoginDto
    {
        public string UserName { get; set; }
        public string Password { get; set; }
    }

    public class AuthResultDto
    {
        public string Token { get; set; }
        public string UserName { get; set; }
        public int UserId { get; set; }
        public UserSettingsDto Settings { get; set; }
    }
}
