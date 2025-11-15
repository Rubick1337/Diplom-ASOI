const { User } = require("../../Data/models/User");
const tokenService = require("./tokenService");
const ApiError = require("../../Presentation/ErrorExtend/ApiError");
const bcrypt = require("bcryptjs");
const UserDto = require("../dtos/userDto")



class UserService {
    async register(email,password,username,role)
    {
        const candidate = await User.findOne({where:{email}});
        if (candidate) {
            throw new Error(`Пользователь с такой почтой ${email} уже есть`);
        }
        const hashPassword = await bcrypt.hash(password, 3);
        const user = await User.create({email, password: hashPassword,username,role});

        const userDto = new UserDto(user);
        const tokens = tokenService.generateToken({...userDto});
        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return {...tokens, user: userDto}
    }
    async login(email, password)
    {
        const user = await User.findOne({where:{email}})
        if (!user) {
            throw ApiError.badRequest("User not found");
        }
        const isPassEqual = await bcrypt.compare(password, user.password);
        if(!isPassEqual){
            throw ApiError.badRequest("Неверный пароль");
        }
        const userDto = new UserDto(user);
        const tokens = tokenService.generateToken({...userDto});

        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return {...tokens, user: userDto}
    }
    async logout(refreshToken) {
        const token = await tokenService.removeToken(refreshToken);
        return token;
    }
    async refresh(refreshToken) {
        console.log(refreshToken + "Заход в user-service");
        if(!refreshToken) {
            throw ApiError.unauthorized("Refresh token not found");
        }
        const tokenFromDb = await tokenService.findToken(refreshToken);
        const userData = tokenService.validateRefreshToken(refreshToken);
        if(!tokenFromDb|| !userData) {
            throw ApiError.unauthorized("Refresh token not found");
        }

        const user = await User.findOne({ where: { id: userData.id } });
        const userDto = new UserDto(user);
        const tokens = tokenService.generateToken({...userDto});
        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return {...tokens, user: userDto}
    }


}

module.exports = new UserService();