import { PartialType } from '@nestjs/mapped-types';
import { CreateWsGatewayDto } from './create-ws-gateway.dto';

export class UpdateWsGatewayDto extends PartialType(CreateWsGatewayDto) {
  id: number;
}
