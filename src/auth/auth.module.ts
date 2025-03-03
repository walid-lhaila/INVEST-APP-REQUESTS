import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { KeycloakStrategy } from './keycloak.strategy';
import { CustomAuthGuard } from './custom-auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'keycloak' })],
  providers: [KeycloakStrategy, CustomAuthGuard, RolesGuard],
  exports: [PassportModule, CustomAuthGuard, KeycloakStrategy, RolesGuard],
})
export class AuthModule {}
