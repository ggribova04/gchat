using gchat_backend.DB;
using gchat_backend.DTO;
using gchat_backend.Interface;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace gchat_backend.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly IPasswordHasher<User> _hasher;

        public AuthService(AppDbContext context, IConfiguration config, IPasswordHasher<User> hasher)
        {
            _context = context;
            _config = config;
            _hasher = hasher;
        }

        public async Task<AuthResultDto> RegisterAsync(UserRegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.UserName) || string.IsNullOrWhiteSpace(dto.Password))
                throw new Exception("Имя пользователя и пароль обязательны");

            if (dto.Password != dto.ConfirmPassword)
                throw new Exception("Пароли не совпадают");

            if (await _context.Users.AnyAsync(u => u.UserName == dto.UserName))
                throw new Exception("Пользователь с таким именем уже существует");

            var user = new User
            {
                NickName = dto.NickName,
                UserName = dto.UserName,
            };

            user.PasswordHash = _hasher.HashPassword(user, dto.Password);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var userSettings = new UserSettings
            {
                UserId = user.Id,
                Theme = "light",
                PhotoUrl = "/images/default_photo.png",
                Language = dto.Language ?? "ru"
            };

            
            _context.UserSettings.Add(userSettings);
            await _context.SaveChangesAsync();

            return GenerateJwt(user);
        }

        public async Task<AuthResultDto> LoginAsync(UserLoginDto dto)
        {
            var user = await _context.Users
             .Include(u => u.Settings)
             .FirstOrDefaultAsync(u => u.UserName == dto.UserName); 
            if (user == null)
                throw new Exception("Неверное имя пользователя");

            var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
            if (result != PasswordVerificationResult.Success)
                throw new Exception("Неверный пароль");

            return GenerateJwt(user);
        }

        private AuthResultDto GenerateJwt(User user)
        {
            var claims = new[]
            {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name, user.UserName),
    };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(1),
                signingCredentials: creds);

            return new AuthResultDto
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                UserName = user.UserName,
                UserId = user.Id,
                Settings = new UserSettingsDto
                {
                    Theme = user.Settings?.Theme ?? "light",
                    Language = user.Settings?.Language ?? "ru",
                    PhotoUrl = user.Settings?.PhotoUrl ?? ""
                }
            };
        }
    }
}
