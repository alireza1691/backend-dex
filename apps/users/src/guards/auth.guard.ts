import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from "../../../../prisma/prisma.service";


@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
 
    
    const gqlContext = GqlExecutionContext.create(context);
    const { req } = await gqlContext.getContext();
    const accessToken = req.headers.accesstoken as string;
    const refreshToken = req.headers.refreshtoken as string;


    if (!accessToken || !refreshToken) {
      throw new UnauthorizedException('Please login to access this resource!');
    }
    if (accessToken) {
      const decoded = this.jwtService.decode(accessToken);
 
      const expirationTime = decoded?.iat;
      console.log("updating...");
    
      
      if (expirationTime * 1000 < Date.now()) {
        await this.updateAcessToken(req);
      }
      console.log("updated");
      
    }
    return true;
  }

  private async updateAcessToken(req: any): Promise<void> {
    
    try {
      const refreshTokenData = req.headers.refreshtoken as string;
      const decoded = this.jwtService.verify(refreshTokenData, {
        secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
      });
      console.log("refresh verified!");
      
      if (!decoded) {
        throw new UnauthorizedException('Invalid refresh token!');
      }
      const user = await this.prisma.account.findUnique({
        where: {
          id: decoded.id,
        },
      });
      const accessToken = this.jwtService.sign(
        { id: user.id },
        {
          secret: this.config.get<string>('ACCESS_TOKEN_SECRET'),
          expiresIn: '15m',
        },
      );
      const refreshToken = this.jwtService.sign(
        { id: user.id },
        {
          secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
          expiresIn: '7d',
        },
      );
      req.accesstoken = accessToken;
      req.refreshtoken = refreshToken;
      req.user = user
      
    } catch (error) {
        console.log(error);
        
    }
  }
}
