import { Injectable, HttpException, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import { BaseService } from 'shared/base.service';
import { InjectModel } from '@nestjs/mongoose';
import { ModelType } from 'typegoose';
import { MapperService } from 'shared/mapper/mapper.service';
import { User } from './models/user.model';
import { RegisterVm } from './models/view-models/register-vm.model';
import { genSalt, hash, compare } from 'bcryptjs';
import { LoginVm } from './models/view-models/login-vm.model';
import { LoginResponseVm } from './models/view-models/login-response-vm.model';
import { JwtPayload } from 'shared/auth/jwt-payload';
import { AuthService } from 'shared/auth/auth.service';
import { UserVm } from './models/view-models/user-vm.model';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(
    @Inject(forwardRef(() => AuthService))
    readonly _authService: AuthService,
    @InjectModel(User.modelName) private readonly _userModel: ModelType<User>,
    private readonly _mapperService: MapperService,
  ) {
    super();
    this._model = _userModel;
    this._mapper = _mapperService.mapper;
  }

  async register(registerVm: RegisterVm): Promise<User> {
    const { username, password, firstName, lastName } = registerVm;

    const newUser = new this._model(); // InstanceType<User>
    newUser.username = username;
    newUser.firstName = firstName;
    newUser.lastName = lastName;

    const salt = await genSalt(10);
    newUser.password = await hash(password, salt);

    try {
      const result = await this.create(newUser);
      return result.toJSON() as User;
    } catch (error) {
      // MongoError
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async login(loginVm: LoginVm): Promise<LoginResponseVm> {
    const { username, password } = loginVm;

    const user = await this.findOne({ username });
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.BAD_REQUEST);
    }

    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      throw new HttpException('Invalid credentials', HttpStatus.BAD_REQUEST);
    }

    const payload: JwtPayload = {
      username: user.username,
      role: user.role,
    };

    const token = await this._authService.signPayload(payload);
    const userVm: UserVm = await this.map<UserVm>(user.toJSON());

    return {
      token,
      user: userVm,
    };
  }
}
