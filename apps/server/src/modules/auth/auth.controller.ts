import { BadRequestException, Body, Controller,Get, HttpCode, Patch, Post, Query, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/buyer.dto';
import { LoginDto } from './dto/login.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegistrationResponse, VendorLoginResponse } from './dto/buyer-response.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("/register")
  @ApiOperation({summary:"Create users"})
  @ApiResponse({
    example:RegistrationResponse
  })
  @ApiBody({
    type:SignupDto,
    
  })
  
  public  async RegisterUser(@Body() body:SignupDto){
      if(!body){
         throw new BadRequestException("request body given was empty")
      }
      return  this.authService.registerUser(body)
  }

  @Post("/login")
  @ApiOperation({summary:"Login Users"})
  @ApiResponse({
    example:VendorLoginResponse
  })
  @ApiBody({
    type:LoginDto
  })
  public async LoginUser(@Body() body:LoginDto){

    return this.authService.loginUser(body)
  }

  @Get("/me")
  @ApiOperation({summary:"Get single user data"})
  @ApiResponse({
    status:200,
    description:"User details fetch successful"
  })
  async getUserDetails(@CurrentUser() user){
    return this.authService.getUser(user.id)
  }


 
}
