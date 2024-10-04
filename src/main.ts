import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: ['http://localhost:5173'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  })

  const config = new DocumentBuilder()
    .setTitle('fullstack-challenge-template-nestjs')
    .setDescription('The account API description')
    .setVersion('1.0')
    .addTag('template')
    //JWT 토큰 설정
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build()

  const document = SwaggerModule.createDocument(app, config)
  app.use(
    '/api',
    apiReference({
      spec: {
        content: document,
      },
      hideModels: true,
    }),
  )

  await app.listen(process.env.APP_PORT || 3000)
}
bootstrap()
