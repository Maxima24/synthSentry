import { BadRequestException, Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/buyer.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto, RefreshTokenResponseDto } from './dto/refresh-token.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RegistrationResponse, VendorLoginResponse } from './dto/buyer-response.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtGuard } from 'src/common/utils/jwt-strategy.utils';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   * PRD: Auth (Basic) - Email/password registration
   */
  @Post('/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    example: RegistrationResponse,
  })
  @ApiBody({ type: SignupDto })
  public async RegisterUser(@Body() body: SignupDto) {
    if (!body) {
      throw new BadRequestException('Request body given was empty');
    }
    return this.authService.registerUser(body);
  }

  /**
   * Login with email and password
   * PRD: Auth (Basic) - JWT login
   */
  @Post('/login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful - returns access and refresh tokens',
    example: VendorLoginResponse,
  })
  @ApiBody({ type: LoginDto })
  public async LoginUser(@Body() body: LoginDto) {
    return this.authService.loginUser(body);
  }

  /**
   * Refresh access token using a valid refresh token
   * PRD: Auth enhancement - token refresh mechanism
   */
  @Post('/refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully - returns new access and refresh tokens',
    type: RefreshTokenResponseDto,
    schema: {
      example: {
        message: 'Token refreshed successfully',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  public async refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refreshToken);
  }

  /**
   * Get current authenticated user details
   */
  @Get('/me')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user details' })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
    schema: {
      example: {
        message: 'User details retrieval successful',
        data: {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'USER',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  async getUserDetails(@CurrentUser() user: { id: string }) {
    return this.authService.getUser(user.id);
  }
}
