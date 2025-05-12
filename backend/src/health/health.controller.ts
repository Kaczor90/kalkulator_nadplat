import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Connection } from 'mongoose';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get application health status' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  @ApiResponse({ status: 503, description: 'Application is not healthy' })
  async checkHealth() {
    const isMongoConnected = this.mongoConnection.readyState === 1;
    
    // Get MongoDB connection details
    const host = this.mongoConnection.host || 'unknown';
    const port = this.mongoConnection.port || 'unknown';
    const name = this.mongoConnection.name || 'unknown';
    
    return {
      status: isMongoConnected ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: isMongoConnected ? 'connected' : 'disconnected',
          type: 'mongodb',
          host: host,
          port: port,
          database: name,
          readyState: this.mongoConnection.readyState,
          readyStateText: this.getReadyStateText(this.mongoConnection.readyState),
          usingAtlas: process.env.MONGODB_URI?.includes('mongodb+srv') || false,
        },
      },
    };
  }

  private getReadyStateText(state: number): string {
    switch (state) {
      case 0: return 'disconnected';
      case 1: return 'connected';
      case 2: return 'connecting';
      case 3: return 'disconnecting';
      default: return 'unknown';
    }
  }
} 