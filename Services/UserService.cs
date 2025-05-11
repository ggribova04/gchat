using AutoMapper;
using gchat_backend.DB;
using gchat_backend.DTO;
using gchat_backend.Interface;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace gchat_backend.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IWebHostEnvironment _env;
        private readonly PasswordHasher<User> _passwordHasher;

        public UserService(AppDbContext context, IMapper mapper, IWebHostEnvironment env)
        {
            _context = context;
            _mapper = mapper;
            _env = env;
            _passwordHasher = new PasswordHasher<User>();
        }

        public async Task<UserDto> GetProfileAsync(string userId)
        {
            var user = await GetUserWithSettingsAsync(userId);
            return _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto> UpdateNickNameAsync(string userId, string newNickName)
        {
            var user = await GetUserAsync(userId);
            user.NickName = newNickName;
            await _context.SaveChangesAsync();
            return _mapper.Map<UserDto>(user);
        }

        public async Task<UserSettingsDto> UpdateThemeAsync(string userId, string theme)
        {
            var user = await GetUserWithSettingsAsync(userId);
            user.Settings.Theme = theme;
            await _context.SaveChangesAsync();
            return _mapper.Map<UserSettingsDto>(user.Settings);
        }

        public async Task<UserSettingsDto> UpdateLanguageAsync(string userId, string language)
        {
            var user = await GetUserWithSettingsAsync(userId);
            user.Settings.Language = language;
            await _context.SaveChangesAsync();
            return _mapper.Map<UserSettingsDto>(user.Settings);
        }

        public async Task ChangePasswordAsync(string userId, ChangePasswordDto dto)
        {
            var user = await GetUserAsync(userId);

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.CurrentPassword);
            if (result == PasswordVerificationResult.Failed)
                throw new Exception("Текущий пароль неверен");

            if (dto.NewPassword != dto.ConfirmPassword)
                throw new Exception("Новый пароль и подтверждение не совпадают");

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);
            await _context.SaveChangesAsync();
        }

        public async Task<string> UploadAvatarAsync(string userId, IFormFile file)
        {
            var user = await GetUserWithSettingsAsync(userId);

            var uploadsPath = Path.Combine(_env.WebRootPath, "uploads/avatars");
            Directory.CreateDirectory(uploadsPath);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            user.Settings.PhotoUrl = $"/uploads/avatars/{fileName}";
            await _context.SaveChangesAsync();

            return user.Settings.PhotoUrl;
        }

        public async Task RemoveAvatarAsync(string userId)
        {
            var user = await GetUserWithSettingsAsync(userId);

            if (!string.IsNullOrEmpty(user.Settings.PhotoUrl) && user.Settings.PhotoUrl != "/images/default-photo.png")
            {
                var filePath = Path.Combine(_env.WebRootPath, user.Settings.PhotoUrl.TrimStart('/'));
                if (File.Exists(filePath))
                    File.Delete(filePath);

                user.Settings.PhotoUrl = "http://localhost:5046/images/default_photo.png";
                await _context.SaveChangesAsync();
            }
        }

        private async Task<User> GetUserAsync(string userId)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Id == int.Parse(userId))
                ?? throw new Exception("Пользователь не найден");
        }

        private async Task<User> GetUserWithSettingsAsync(string userId)
        {
            return await _context.Users
                .Include(u => u.Settings)
                .FirstOrDefaultAsync(u => u.Id == int.Parse(userId))
                ?? throw new Exception("Пользователь не найден");
        }
    }
}