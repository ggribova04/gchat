using gchat_backend.DB;
using gchat_backend.DTO;
using AutoMapper;

namespace gchat_backend
{
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            CreateMap<User, UserDto>();
            CreateMap<UserSettings, UserSettingsDto>();
        }
    }
}
